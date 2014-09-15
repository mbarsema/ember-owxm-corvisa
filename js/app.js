//TODO: Styling
//TODO: Packaging
//TODO: Commenting
//TODO: Browser Testing
//TODO: Look at structure
//TODO: Testing/Error handling

var App = Ember.Application.create();

App.WXSettings = {
	limit: 15,
	location: {
		'lat': null,
		'long': null 
	}
};

App.WXCities = {};

App.Weather = Ember.Object.extend({
	currents: {},
	forecasts: [],
	allForecasts: []
});

App.IndexController = Ember.ObjectController.extend({
    actions: {
        updateWeather: function(){
        	this.send('invalidateModel');
        }
    }
});

// route
App.IndexRoute = Ember.Route.extend({
	model: function(params){
		var queryString = getQueryString();
		var lat = null;
		var lon = null;
		if(queryString != null){
			lat = queryString['lat'];
			lon = queryString['long'];
		}
		var currentsUrl = 'http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lon;
		var forecastsUrl = 'http://api.openweathermap.org/data/2.5/forecast/daily?lat='+lat+'&lon='+lon+'&cnt=15';
		var weatherPromise = new Ember.RSVP.Promise(function(resolve, reject){
			var weather = App.Weather.create();
			Ember.$.getJSON(currentsUrl).then(function(data){
				weather.setProperties({'currents': normalizeCurrents(data)});
			});
			Ember.$.getJSON(forecastsUrl).then(function(data){
				var forecasts = normalizeForecasts(data);
				var selected = cloneArray( forecasts );
				var limit = App.WXSettings.limit;
				if( limit > 15 ){
					limit = 15;
				}else if( limit < 1 ){
					limit = 1;
				}
				selected.splice(limit, forecasts.length - limit);
				weather.setProperties({'forecasts': selected});
				weather.setProperties({'allForecasts': forecasts});
			});
			resolve(weather);
		});
		return weatherPromise;
	},
	actions: {
		invalidateModel: function(){
			this.refresh();
		}
	}
});

/**
 * Normalizes current conditions and turns them into something more useful for our front end.
 * We convert here to avoid an unnecessary AJAX request.
 * @return object - the normalized group of conditions
 * @param config - the current conditions
 */
var normalizeCurrents = function( config ){
	// Convert from scientific to something useful
	var currentTempC = convertToCelsius( config.main.temp );
	var highTempC = convertToCelsius( config.main.temp_max );
	var lowTempC = convertToCelsius( config.main.temp_min );
	var currentTempF = convertToFahrenheit( currentTempC );
	var highTempF = convertToFahrenheit( highTempC );
	var lowTempF = convertToFahrenheit( lowTempC );
	var windMph = convertToMPH( config.wind.speed );
	var windKnots = convertToKnots( windMph );
	var windDirection = degToWindDirection( config.wind.deg );
	var pressureInch = convertToInches(  config.main.pressure );
	var pressureInchSL = convertToInches( config.main.sea_level );
	var pressureInchGL = convertToInches( config.main.grnd_level );
	var conditionsTmp = config.weather[0];

	return {
		'temps': {
			'kelvin': {
				'current': config.main.temp,
				'high': config.main.temp_max,
				'low': config.main.temp_min
			},
			'celsius': {
				'current': currentTempC,
				'high': highTempC,
				'low': lowTempC
			},
			'fahrenheit': {
				'current': currentTempF,
				'high': highTempF,
				'low': lowTempF
			}
		},
		'conditions': conditionsTmp.main, // config.weather.0.main,
		'conditions_long': conditionsTmp.description,  //config.weather.0.description,
		'icon': convertToIcon( conditionsTmp.icon ), 
		'wind': {
			'speed': {
				'mps': config.wind.speed,
				'mph': windMph,
				'knts': windKnots
			},
			'direction': {
				'deg': config.wind.deg,
				'dir': windDirection
			}
		},
		'humidity': config.main.humidity,
		'pressure': {
			'barometric': {
				'mb': config.main.pressure,
				'in': pressureInch
			},
			'sea_level': {
				'mb': config.main.sea_level,
				'in': pressureInchSL
			},
			'ground_level': {
				'mb': config.main.grnd_level,
				'in': pressureInchGL
			}
		},
		'cloud_coverage': config.clouds.all,
		'sunrise': convertTimestampToString( config.sys.sunrise, 'time' ),
		'sunset': convertTimestampToString( config.sys.sunset, 'time' ),
		'last_updated': convertTimestampToString( config.dt, 'datetime' ),
		'location': {
			'country': config.sys.country,
			'city': config.name
		}
	};
};
/**
 * Normalizes a forecast and turns them into something more useful for our front end.
 * We convert here to avoid an unnecessary AJAX request.
 * @return object - the normalized group of forecasts
 * @param config - the forecast
 */
var normalizeForecasts = function( config, limit ){
	var forecasts = [];
	var highTempC = 0;
	var lowTempC = 0;
	var morningC = 0;
	var dayC = 0;
	var eveC = 0;
	var nightC = 0;
	var highTempF = 0;
	var lowTempF = 0;
	var morningF = 0;
	var dayF = 0;
	var eveF = 0;
	var nightF = 0;
	var pressureInch = 0;
	var windMph = 0;
	var windKnots = 0;
	var windDirection = '';
	var item = {};
	var weather = {};
	var dayName = 'Today';
	
	for( var i in config.list ){
		if(!config.list.hasOwnProperty(i)) continue;
		item = config.list[i];
		weather = item['weather'][0];
		highTempC = convertToCelsius( item.temp.max );
		lowTempC = convertToCelsius( item.temp.min );
		morningC = convertToCelsius( item.temp.morn );
		dayC = convertToCelsius( item.temp.day );
		eveC = convertToCelsius( item.temp.eve );
		nightC = convertToCelsius( item.temp.night );
		highTempF = convertToFahrenheit( highTempC );
		lowTempF = convertToFahrenheit( lowTempC );
		morningF = convertToFahrenheit( morningC );
		dayF = convertToFahrenheit( dayC );
		eveF = convertToFahrenheit( eveC );
		nightF = convertToFahrenheit( nightC );
		windMph = convertToMPH( item.speed );
		windKnots = convertToKnots( windMph );
		windDirection = degToWindDirection( item.deg );
		pressureInch = convertToInches(  item.pressure );
		dayName = convertToDayName( item.dt, i );
	
		forecasts.push({
			'id':{
				'card': 'forecast-card-'+i,
				'header': 'forecast-header-' + i,
				'icon': 'forecast-icon-' + i,
				'temp': {
					'fahrenheit': {
						'high': 'forecast-temp-fahrenheit-high-' + i,
						'low': 'forecast-temp-fahrenheit-low-' + i
					},
					'celsius': {
						'high': 'forecast-temp-celsius-high-'+i,
						'low': 'forecast-temp-celsius-low-'+i
					}
				},
				'conditions': 'forecast-conditions-' + i,
				'details': 'forecast-details-' + i,
				'detheader': 'forecast-details-header-'+i
			},
			'dayId': i,
			'day': dayName,
			'temps': {
				'kelvin': {
					'high': item.temp.max,
					'low': item.temp.min,
					'period': {
						'morning': item.temp.morn,
						'daytime': item.temp.day,
						'evening': item.temp.eve,
						'overnight': item.temp.night
					}
				},
				'celsius': {
					'high': highTempC,
					'low': lowTempC,
					'period': {
						'morning': morningC,
						'daytime': dayC,
						'evening': eveC,
						'overnight': nightC
					}
				},
				'fahrenheit': {
					'high': highTempF,
					'low': lowTempF,
					'period': {
						'morning': morningF,
						'daytime': dayF,
						'evening': eveF,
						'overnight': nightF
					}
				}
			},
			'pressure': {
				'barometric': {
					'mb': item.pressure,
					'in': pressureInch
				}
			},
			'wind': {
				'speed': {
					'mps': item.speed,
					'mph': windMph,
					'knts': windKnots
				},
				'direction': {
					'deg': item.deg,
					'dir': windDirection
				}
			},
			'conditions': weather.main,
			'conditions_long': weather.description,
			'icon': convertToIcon( weather.icon ),
			'last_updated': convertTimestampToString( item.dt, 'dayanddate' ),
			'humidity': item.humidity,
			'cloud_coverage': item.clouds,
			'percent_chance': item.rain
		});
	};
	return forecasts;
};
/**
 * Converts an icon number into a link.
 * NOTE: This function was originally intended to return actual links to custom icons,
 * I never got around to that. Also note I was going to create icons, but rip off these instead:
 * http://darkskyapp.github.io/skycons/
 * 
 * @return string - the icon to use
 * @param string - the code to get the generated icons 
 */
var convertToIcon = function( icon ){
	return 'http://openweathermap.org/img/w/'+ icon +'.png';
	
	switch( icon ){
		case '01d': return 'resources/icons/clear.png';
		case '01n': return 'resources/icons/clear_night.png';
		case '02d': return 'resources/icons/few_clouds.png';
		case '02n': return 'resources/icons/few_clouds_night.png';
		case '03d': return 'resources/icons/scattered_clouds.png';
		case '03n': return 'resources/icons/scattered_clouds_night.png';
		case '04d': return 'resources/icons/broken_clouds.png';
		case '04n': return 'resources/icons/broken_clouds_night.png';
		case '09d': return 'resources/icons/shower_rain.png';
		case '09n': return 'resources/icons/shower_rain_night.png';
		case '10d': return 'resources/icons/rain.png';
		case '10n': return 'resources/icons/rain_night.png';
		case '11d': return 'resources/icons/tstorms.png';
		case '11n': return 'resources/icons/tstorms_night.png';
		case '13d': return 'resources/icons/snow.png';
		case '13n': return 'resources/icons/snow_night.png';
		case '50d': return 'resources/icons/mist.png';
		case '50n': return 'resources/icons/mist_night.png';
	}
};

/**
 * Convert from Kelvin to Celsius
 * @return int temperature in celsius
 * @param int temperature in Kelvin
 */
var convertToCelsius = function( temp ){
	if( temp == '' || temp == null ) return '';
	var myTemp = temp - 273.15;
	return Math.round(myTemp);
};

/**
 * Convert from Celsius to Fahrenheit
 * @return int temperature in Fahrenheit
 * @param int temperature in Celsius
 */
var convertToFahrenheit = function( temp ){
	if( temp == '' || temp == null ) return '';
	var myTemp = (((temp * 9) / 5) + 32);
	return Math.round(myTemp);
};

/**
 * Convert to MPH from m/s 
 * @return int - the number of miles per hour
 * @param int - the number of meters per second to convert
 */
var convertToMPH = function( mps ){
	if(mps == '' || mps == null) return '';
	var mph = (mps / (1609.344 / 3600));
	return Math.round( mph );
};

/**
 * Convert from MPH to knots
 * @return int - the number of knots per hour
 * @param int - the number of mph to convert
 */
var convertToKnots = function( mph ){
	if( mph == '' || mph == null ) return '';
	return  Math.round(mph * 1.15078);
};

/**
 * Convert from mb (or hPa) to inch. (mb and hPa are the same units.)
 * @return int - the number of inches
 * @return int - the number of mb/hPa
 */
var convertToInches = function( mb ){
	if( mb == '' || mb == null ) return null;
	return Math.round( (mb / 33.86) * 100) / 100;
};

/**
 * Convert degrees into a normalized reading
 * @return string - the direction the wind is blowing
 * @param int deg - the degrees the wind is blowing
 */
var degToWindDirection = function( deg ){
	var windDirection = '';
	if( deg >= 348.75 && deg < 11.25 ){
		windDirection = 'N';
	}else if( deg >= 11.25 && deg < 33.75 ){
		windDirection = 'NNE';
	}else if( deg >= 33.75 && deg < 56.25 ){
		windDirection = 'NE';
	}else if( deg >= 56.25 && deg < 78.75){
		windDirection = 'ENE';
	}else if( deg >= 78.75 && deg < 101.25){
		windDirection = 'E';
	}else if( deg >= 101.25 && deg < 123.75){
		windDirection = 'ESE';
	}else if( deg >= 123.75 && deg < 146.25){
		windDirection = 'SE';
	}else if( deg >= 146.25 && deg < 168.75){
		windDirection = 'SSE';
	}else if( deg >= 168.75 && deg < 191.25 ){
		windDirection = 'S';
	}else if( deg >= 191.25 && deg < 213.75){
		windDirection = 'SSW';
	}else if( deg >= 213.75 && deg < 236.25){
		windDirection = 'SW';
	}else if( deg >= 236.25 && deg < 258.75 ){
		windDirection = 'WSW';
	}else if( deg >= 258.75 && deg < 281.25 ){
		windDirection = 'W';
	}else if( deg >= 281.25 && deg < 303.75 ){
		windDirection = 'WNW';
	}else if( deg >= 303.75 && deg < 326.25){
		windDirection = 'NW';
	}else if( deg >= 326.25 && deg < 348.75){
		windDirection = 'NNW';
	}
	return windDirection;
};

/**
 * Converts from a timestamp to the name of the given day
 * @return string - the name of the day
 * @param int - a UNIX timestamp
 */
var convertToDayName = function( datetime ){
	var dateObj = new Date(datetime * 1000);
	var day = dateObj.getDay();
	
	switch( day ){
		case 0: return 'Sun';
		case 1: return 'Mon';
		case 2: return 'Tue';
		case 3: return 'Wed';
		case 4: return 'Thu';
		case 5: return 'Fri';
		case 6: return 'Sat';
	}
};

/**
 * Converts a UX timestamp to a date/time string
 *
 * @return - the useable date/time string
 * @param - the timestamp to format
 * @param - the format to convert to
 */
var convertTimestampToString = function( timestamp, format ){
	var dateString = '';
	var dateObj = new Date(timestamp*1000);
	
	var hours = dateObj.getHours();
	var minutes = dateObj.getMinutes();
	var seconds = dateObj.getSeconds();
	var date = dateObj.getDate();
	var year = dateObj.getFullYear();
	var month = dateObj.getMonth();
	var day = dateObj.getDay();
	
	// Grab the AM/PM part of the time
	var ampm = 'AM';
	if( hours > 12 && hours < 24 ){
		ampm = 'PM';
		hours -= 12;
	}else if( hours == 12 ){
		ampm = 'PM';
		hours = 12;
	}else if( hours == 0 ){
		hours = 12;
		ampm = 'AM';
	}
	
	// Format our minutes correctly
	if( minutes < 10 ){
		minutes = '0' + minutes;
	}
	
	switch( month ){
		case 0: month = 'Jan'; break;
		case 1: month = 'Feb'; break;
		case 2: month = 'Mar'; break;
		case 3: month = 'Apr'; break;
		case 4: month = 'May'; break;
		case 5: month = 'Jun'; break;
		case 6: month = 'Jul'; break;
		case 7: month = 'Aug'; break;
		case 8: month = 'Sep'; break;
		case 9: month = 'Oct'; break;
		case 10: month = 'Nov'; break;
		case 11: month = 'Dec'; break;
	}
	
	switch( day ){
		case 0: day = 'Sun'; break;
		case 1: day = 'Mon'; break;
		case 2: day = 'Tue'; break;
		case 3: day = 'Wed'; break;
		case 4: day = 'Thu'; break;
		case 5: day = 'Fri'; break;
		case 6: day = 'Sat'; break;
	}
	
	
	switch( format ){
		case 'datetime':
			dateString = month + ' ' + date + ', ' + year + ' ' + hours + ':' + minutes + ' ' + ampm;
		break;
		case 'date':
			dateString = month + ' ' + date +', ' + year;
		break;
		case 'time':
			dateString = hours + ':' + minutes + ' ' + ampm;
		break;
		case 'dayanddate':
			dateString = day + ' ' + month + ' ' + date + ', ' + year;
		break;
	}
	return dateString;
};

/**
 * Obtains query string parameters
 *
 * @return object of query string parameters
 * @param none
 */
var getQueryString = function(){
	var params = null;
	var URL = document.location.href;
	var queryString = URL.split('?')[1];
	if( queryString ){
		params = {};
    	queryString = queryString.split('&');
    	for( var i in queryString ){
    		if( !queryString.hasOwnProperty(i)) continue;
    		var parts = queryString[i].split('=');
    		params[parts[0]] = parts[1];
    	}
    }
    return params;
}

/**
 * Deep copy of our array, used to convert 'allForecasts' to spliced 'forecasts'
 * 
 * @return - the cloned araray
 * @param obj - the array to be cloned
 */
var cloneArray = function( obj ){
	var newObj = [];
	for( var i in obj ){
		if(!obj.hasOwnProperty(i)) continue;
		newObj[i] = obj[i];
	}
	return newObj;
};
/**
 * Forces an update on the weather when you change locations
 *
 * @return none
 * @param int lat - the latitude
 * @param int lon - the longitude
 *
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.forceWeatherUpdate
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
var forceWeatherUpdate = function(lat, lon){
	var controller = App.__container__.lookup('controller:index');
	var model = controller.get('model');
	var forecasts = model.get('forecasts');
	
	var now = new Date();
	var timestamp = now.toISOString();
	var limit = App.WXSettings.limit;
			
	App.WXCities['current'] = {
		'location': 'current',
		'timestamp': timestamp,
		'data': {}
	};
	
	$.getJSON('http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lon, function( data ){
		model.setProperties({'currents': normalizeCurrents( data )});
		App.WXCities['current']['data']['currents'] = normalizeCurrents( data );
	});
	
	$.getJSON('http://api.openweathermap.org/data/2.5/forecast/daily?lat='+lat+'&lon='+lon+'&cnt=15', function( data ){
		var forecasts = normalizeForecasts( data );
		var selected = cloneArray( forecasts );
		selected.splice( limit, forecasts.length - limit );
		model.setProperties({"allForecasts": forecasts});
		model.setProperties({"forecasts": selected});
		App.WXCities['current']['data']['allForecasts'] = forecasts;
		App.WXCities['current']['data']['forecasts'] = selected;
	});
	loadLocations();
};

/**
 * Updates the days of the forecast based on a button click
 * 
 * @return none
 * @param int days - the number of days to update our model with
 *
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.updateForecastDays
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
var updateForecastDays = function( days ){
	App.WXSettings.length = days;
	var controller = App.__container__.lookup("controller:index");
	var model = controller.get("model");
	var allForecasts = model.get("allForecasts");
	var forecasts = cloneArray( allForecasts );
	forecasts.splice( days, forecasts.length - days );
	model.setProperties({"forecasts": forecasts});
};

/**
 * Populates the given request
 * 
 * @return none
 * @param string city - the city we are looking up
 * @param string locID - the ID associated with the city
 * @param bool switchTab - whether to switch a given tab when we are completed
 *
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.populateWeather
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
var populateWeather = function( city, locID, switchTab ){
	var now = new Date();
	var timestamp = now.toISOString();
	var limit = App.WXSettings.limit;
			
	App.WXCities[locID] = {
		'location': city,
		'timestamp': timestamp,
		'data': {}
	};
		
	$.getJSON('http://api.openweathermap.org/data/2.5/weather?q='+city, function( data ){
		var currents = normalizeCurrents( data );
		App.WXCities[locID]['data']['currents'] = currents;
		if( switchTab ){
			switchWeather( App.WXCities[locID] );
		}
	});
		
	$.getJSON('http://api.openweathermap.org/data/2.5/forecast/daily?q='+city+'&cnt=15', function( data ){
		var forecasts = normalizeForecasts( data );
		var selected = cloneArray( forecasts );
		
		selected.splice( limit, forecasts.length - limit );
		App.WXCities[locID]['data']['allForecasts'] = forecasts;
		App.WXCities[locID]['data']['forecasts'] = selected;
		if( switchTab ){
			switchWeather( App.WXCities[locID] );
		}
	});
};

/**
 * Updates our weather cache
 * @return none
 * @param string city - the name of the city we are retrieving from cache
 *
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.updateWeatherCache
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
updateWeatherCache = function( city ){
	var locID = getLocationID( city );
	populateWeather( city, locID, false );
};

/**
 * Searches our weather cache and populates if new
 * @return none
 * @param string city -t he name of the city we are retrieving from cache
 * 
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.searchWeather
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
var searchWeather = function( city ){
	// If we're looking at the current location, start watching.
	if( city == 'current' ){
		positionInterval = navigator.geolocation.watchPosition(getPosition, notifyError);
		switchWeather( App.WXCities[city] );
		return;
	}
	
	var locID = getLocationID( city );

	if( typeof( App.WXCities[locID] ) == 'object' ){
		switchWeather( App.WXCities[locID] );
		return;
	}
	populateWeather( city, locID, true );
};

/**
 * Switches between our weather cache 
 * 
 * @return none
 * @param weatherObj - a weather object contained within our weather cache
 *
 * NOTE: This is a function rather than a method in some class because it offers utility
 * to the index.html file. It would be possible to put this in some class like Util.WX.switchWeather
 * but for the purposes of this demonstration this is the only time or place this is used. 
 * There is no need to over complicate things.
 */
var switchWeather = function( weatherObj ){
	// When we switch away from the current we stop the position interval
	if( weatherObj.location !== 'current' ){
		navigator.geolocation.clearWatch( positionInterval );
	}
	handleTabs( weatherObj.location );
	var controller = App.__container__.lookup("controller:index");
	var model = controller.get("model");
	model.setProperties( weatherObj.data );
};

/**
 * Handles the creation and update of tabs
 * 
 * @return none
 * @param location
 */
var handleTabs = function( location ){
	clearStyling('selected-tab');
	clearStyling('updated-tab');
	
	var locID = getLocationID( location );
	var tabs = document.getElementById('weather-tabs');
	var cityTab = document.getElementById('weather-tab-' + locID);
	if( cityTab == null){
		var cityTab = document.createElement('li');
		cityTab.appendChild(document.createTextNode(location));
		cityTab.id = 'weather-tab-' + locID;
		cityTab.className = 'location';
		cityTab.onclick = function( event ){
			var city = document.getElementById( event.target.id ).innerHTML;
			searchWeather( city );
		};
		tabs.appendChild( cityTab );	
	}
	cityTab.className += ' selected-tab';
};

/**
 * Removes styling from our classes
 * 
 * @return none
 * @param string query - the query for the style to be removed
 */
var clearStyling = function( query ){
	var tabs = document.querySelectorAll('.'+query);
	for( var i in tabs ){
		if(!tabs.hasOwnProperty(i)) continue;
		var elem = document.getElementById( tabs[i].id );
		if( elem == null ) continue;
		$('#'+elem.id).removeClass(query);	
	}
};

/**
 * Updates the styling for a given element
 * 
 * @return none
 * @param query - the style to update
 * @param name - the name of the style attribute
 * @param value - the value to set the style
 */
var updateStyling = function( query, name, value ){
	var elems = document.querySelectorAll( query );
	for( var i in elems ){
		if(!elems.hasOwnProperty(i)) continue;
		var elem = document.getElementById( elems[i].id );
		elem.style[name] = value;
	}
};

/**
 * Obtain our current position
 *
 * @return object position - the newly obtained position
 * @param object position - the current position
 */
var getPosition = function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    if( App.WXSettings.location['lat'] != lat && App.WXSettings.location['long'] != lon ){
    	App.WXSettings.location = {'lat': lat, 'long': lon};
    	forceWeatherUpdate(lat,lon);
    }
    return position;
};

/**
 * Notifies the browser that an error has occurred in geolocation
 *
 * @return none
 * @param none
 */
var notifyError = function(){
	var elem = document.getElementById("error");
	elem.innerHTML += "Could not obtain geolocation";
	navigator.geolocation.clearWatch( positionInterval );
};

/**
 * Toggles between standard and metric units
 * 
 * @return none
 * @param string type - the type of we are toggling to
 */
var toggle = function( type ){
	var standardElements = document.querySelectorAll(".standard");
	var metricElements = document.querySelectorAll(".metric");
	
	var sDisplay = 'block';
	var mDisplay = 'block';
	if( type == 's' ){
		sDisplay = 'block';
		mDisplay = 'none';
	}else if( type == 'm' ){
		sDisplay = 'none';
		mDisplay = 'block';
	}
	
	for( var i in standardElements ){
		if(!standardElements.hasOwnProperty(i)) continue;
		if( standardElements[i].id == "") continue;
		document.getElementById( standardElements[i].id ).style.display = sDisplay;
	}
	
	for( var i in metricElements ){
		if(!metricElements.hasOwnProperty(i)) continue;
		if( metricElements[i].id == "" ) continue;
		document.getElementById( metricElements[i].id ).style.display = mDisplay;
	}
};

/**
 * Toggles the number of dates displayed
 * 
 * @return none
 * @param days - the number of days to toggle
 */
var toggleDates = function( days ){
	updateForecastDays( days );
};

/**
 * Transforms a location name into a location ID
 *
 * @return string - the location ID
 * @param string location - the location to turn into an ID
 */
var getLocationID = function( location ){
	var locID = location.replace(/ /g, '');
	locID = locID.replace(/\,/g, '');
	locID = locID.toLowerCase();
	return locID;
};

/**
 * Stores a location in our registry
 *
 * @return none
 * @param none
 * 
 * NOTE: We use local storage to save settings of individual locations
 */
var registerLocation = function(){	
	var locID = getLocationIDFromTab();
	// Never add the current to our store. It is always present
	if( locID == 'current') return;
	if(typeof(Storage) === "undefined") return;
	var weatherObj = App.WXCities[locID];
	var weather = {};
	if( typeof(localStorage.weather) !== 'undefined' ){
		weather = JSON.parse( localStorage.weather );
	}
	if( typeof( weather.locations ) === 'undefined' ){
		weather.locations = [];
	}
	var locations = weather.locations;
	if(weather.locations.indexOf( weatherObj.location ) === -1 ){
		weather.locations.push( weatherObj.location );
	}
	localStorage.weather = JSON.stringify( weather );
};

/**
 * Removes a location from our registry
 *
 * @return none
 * @param none
 *
 * NOTE: We use local storage to save settings of individual locations
 */
var unregisterLocation = function(){
	var locID = getLocationIDFromTab();
	// Never delete the current tab
	if( locID == 'current' ) return;
	
	// Remove tab and go back to current tab
	var elem = document.getElementById("weather-tab-"+locID);
	elem.parentNode.removeChild( elem );
	searchWeather('current');

	if(typeof(Storage) === 'undefined') return;
	if(typeof(localStorage.weather) == 'undefined') return;
	var weather = JSON.parse(localStorage.weather);
	if(typeof(weather.locations) === 'undefined') return;
	var weatherObj = App.WXCities[locID];
	var index = weather.locations.indexOf( weatherObj.location );
	if( index === -1 ) return;
	weather.locations.splice( index, 1 );
	localStorage.weather = JSON.stringify( weather );
};

/*
 * Purges local storage
 *
 * @return none
 * @param none
 */
var purgeStorage = function( ){
	if(typeof(Storage) == 'undefined') return;
	delete localStorage.weather;
};

/**
 * Obtain the current location from our tabs
 *
 * @return string - the ID of the current location
 * @param noen
 */
var getLocationIDFromTab = function( ){
	var tab = document.querySelector('.selected-tab');
	return tab.id.replace(/^weather-tab-/, '');
};

/**
 * Load our stored locations
 *
 * @return none
 * @param none
 */
var loadLocations = function(){
	if(typeof(Storage) === 'undefined') return;
	if(typeof(localStorage.weather) == 'undefined') return;
	var weather = JSON.parse(localStorage.weather);
	if(typeof(weather.locations) === 'undefined') return;
	for( var i in weather.locations ){
		if(!weather.locations.hasOwnProperty(i)) continue;
		// Calling handleTabs will allow us to lazy load.
		handleTabs( weather.locations[i] );
	}
	searchWeather('current');
	
	// Update each of our searches every 20 minutes
	if(batchDownload === null ){
		batchDownload = setInterval(function(){
			var tab = document.querySelector('.selected-tab');
			var location = tab.innerHTML;
			if( tab.id.replace(/^weather-tab-/, '') == 'current'){
				location = 'current';
			}
			for( var i in weather.locations ){
				if(!weather.locations.hasOwnProperty(i)) continue;
				updateWeatherCache( weather.locations[i] );
			}
		}, (1000 * 60 * 20));
	}
};


var positionInterval = null;
var batchDownload = null;
if( navigator.geolocation ){
	positionInterval = navigator.geolocation.watchPosition(getPosition, notifyError);
}