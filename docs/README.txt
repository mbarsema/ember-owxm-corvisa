Installation and build:

Download files from Github. Copy downloaded files to server. Done.

Running:

Visit the page, no configuration necessary.

Usage:
The origin location will always be null, null and display Earth. This happens until the browser fetches your actual
location. Once this occurs your data will automatically update. You can swap from standard to metric units by clicking on the
F and C keys. Likewise you can swap between the number of days by clicking on those buttons. The plus and minus buttons are for
saving your location settings. You can search locations using the search box on the top. ONLY if you click the + button are your
settings saved for your next available selection. Note that this is NOT the same as what was described in the core requirements.
See section on Changes to the Requirements for more information.

For best experience use Firefox! I primarily tested in Firefox. I made sure that functionality was maintained
but as someone who tinkers with code up until the last minute, things may accidentally break late in the game!

Bonus Features:

Data Caching
Multi-day forecast data is cached for 20 minutes. Caching is NOT for the remainder of the day. See section on Pesronal Notes
for additional information. Keep in mind each time the page reloads you will ALWAYS get new data that is then cached for 20 minutes.

Batch Downloading:
The cache of locations will download every twenty minutes for each individual location. The exception to that is when you are on
your specific location. That will update with the defaults of the browser.

Templating / Data Binding:
I used Ember for templating and data binding. This was my first Ember project so I wasn't sure of the exact syntax for updating
certain pieces of the model. If judging Ember style, keep in mind this was a beginner project.


Skipped Bonus:

Mobile Support: 
Responsive design is important but if I wanted to make a mobile weather app I would (and have) done it natively.

MVC/Deep Linking:

Iconography:
I'm not graphically talented enough to build good looking icons. Plus there are open source ones!
Icons that would have been used can be found here: http://darkskyapp.github.io/skycons/

Themes: 
I ran out of time for theming. Plus there's only so many ways to skin a weather app. 
A different color scheme probably would have been better but that scheme is personal.
Personal demo, I get to choose.

Build:
I should have ran JSLint and minified but this is a demo that needs to be read. It's a good for both but this is NOT
a production environment and is treated for dmeos sake.


Changes to the Requirements:

The original scope of this project was to use configuration settings to display weather information for a given area.
I misread the original requirements and assumed that this was not an APPLICATION CONFIGURATION but rather a CLIENT CONFIGURATION.
This meant that I began development with the intent to give the end user complete control over all settings. Because of this the
following features have been added:

1) There is a navigation panel (originally tabs) on the far left that controls locations. 
By default you are given a My Location selection. This uses the browser's capabilities to determine your location.
When that location is selected it will consistently update. When it is OFF, it will be shut off. The navigation panel
cannot be removed. When searching by location (city name only!) you it's navigation will be added to the panel. You can SAVE
the location at any time by clicking the (+) icon. You can delete the location by clicking the (-) icon.

2) Standard and metric are handled client side rather than server side. This means that all conversions are handled in JavaScript.
Click on the F and C to go between icons. In hindsight these configurations should have been saved.

3) Changing the number of displayed dates is handled via buttons instead of through configuration. In hindsight this configuration
should have been saved. Likewise making the design for dates responsive may have looked better.

Bugs:

Sunrise, sunset, and generic times are shown in local time:
Because dates and times are returned as a timestamp and NOT as a date/time string they can ONLY be shown in the locale of 
the client. This is a major issue when viewing sunrise and sunset information. See API Notes for more information. (There is no
fix for this.) 

Potential HTML Injection Through Search box: 
I did not properly test to make sure someone would spontaneously add HTML to the search box. Someone can inject
HTML into the search box and blow up the universe. 
This is only a demo. 
Don't be that guy or you may end up angering the weather gods.

Data Sanity Checks:
I didn't check to see if the data you entered into that search box made sense. 
In other words typing in a lat/long will probably blow up the universe.
This is only a demo.
Don't be that guy or you may end up angering the weather gods. 

API Notes:

OpenWeatherMap.org is a decent API but it does have it's quirks. The aforementioned problem with timestamps is a major cause for
concern. Likewise the fact that everything is presented in scientific units rather than the units of the location seems an odd 
choice. Another quirk being that degrees are used instead of wind directions (N,S,E,W) are a bit of a quirk.

Most weather APIs usually include additional information like the Feels Like temperature, the visibility, and dew point. 
Most of this data falls in the nice to have category. 
(The dew point is especially useful since it can help you compute the Feels Like temperature.)

Another place for concern is how OpenWeatherMap.org handles querying for locations. Allowing you to type in "London" or "Chicago"
is great for a large city. But what happens if you type in "Albany?" Is that Albany, NY or Albany, IL? Likewise typing in whatever
you choose does not scale properly when it comes to locations. Instead there needs to be type ahead and specific location information
stored for the API to be correct. 

Personal Notes:

I've written (and re-written) a weather API backend for over five years now. Two of those API's were written with Weather Central
as our vendor. One was with Intellicast. The last (and current) implementation is me working on a weather API in my spare time.
This project was designed to replace the $1,200 per month fee charged for a weather vendor in a given time period.

My API is designed to allow free access to weather information like OpenWeatherMap. So far it lacks a locations database 
but works for the continental US. It also lacks weather maps at present. 

The reason why caching works on 20 minute intervals is that each vendor (myself included) cached individual items for a set
time period. The time period was used because current conditions AND FORECASTS update periodically through the day. Most times
NOAA updates current conditions once an hour -- but some locations update more frequently. As such to stay current you MUST
update more frequently than "once a day" for a given forecast. 

Weather software is difficult to write because of individual locations. You MUST have a database of locations 
to operate correctly. In America, each location is then mapped up to a name, a lat/long, and a METAR. The METAR is 
the place to find closest current weather observations. These are then mapped giving you the conditions and forecasts.
The trickiness of this is that you need to account for things like mountain ranges, the curvature of the Earth and
the like. Once you HAVE that location database the rest is easily handled.

Handling server side requests and caching is also a tricky business. At TownNews.com we handled over 2 million hits in 2 days
with a 99% cache/hit ratio upon release of the latest iteration of the weather package. We could do this because we used
zip codes and ONLY zip codes. Using latitudes and longitudes would NOT scale appropriately with the infrastructure we had.

I'm still trying to figure out the way that a company like Yahoo! implemented caching across the board. The reason why this 
doesn't work for most companies (and why lat/long doesn't scale) is that each lat/long would be an individual cache key. 
This means that for each location on Earth you have an individual cache key. 

How many cache keys? Well, let's take into account that there are 360 main points of latitude and longitude. Assuming Google's
lat/long finder is correct, they allow for up to four significant digits. So for each of the 360 points we have 9999 ADDITIONAL
potential cache keys. This means that we have the possibility of having at least 3,600,000 cache keys. How do you cache that appropriately
with the given resources? I have a few theories -- but my assumption is: this won't scale appropriately.