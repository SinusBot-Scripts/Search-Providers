registerPlugin({
    name: 'YouTube Search Provider',
    version: '1.0.0',
    description: 'Searches YouTube for Videos',
    author: 'Lala Sabathil <aiko@aitsys.dev>',
    engine: '>= 1.0.0',
    backends: ['discord'],
	requiredModules: ["http"],
    autorun: false,
    vars: [
        {
            name: 'youtube_api_key',
            title: 'API KEY (https://console.developers.google.com/project)',
            type: 'string'
        },
        {
            name: 'safe_search',
            title: 'Safe search',
            type: 'select',
            options: ['none', 'moderate', 'strict'],
            default: "1"
        }
    ]
}, function(_, config, meta) {
const event = require('event');
const engine = require('engine');
const backend = require('backend');
const http = require("http");

let safeSearch;
if (config.safe_search == 0)
    safeSearch = "none";
else if (config.safe_search == 1)
    safeSearch = "moderate";
else if (config.safe_search == 2)
    safeSearch = "strict";

event.on("load", () => {
    const command = require("command")
    if (!command) throw new Error("command.js library not found! Please download command.js and enable it to be able use this script!")

    engine.log(`Command prefix is ${command.getCommandPrefix()}`)

    command.createCommand("ytsearch")
        .help("Searches YouTube for Videos")
        .manual("This will let you search youtube for videos")
        .addArgument(args => args.rest.setName("query"))
    .exec((client, args, reply, ev) => {
        engine.log("Searching for " + args.query);
        let curChannel = ev.message.channel().ID();
        engine.log(curChannel.split('/')[1]);
        var youtubeApi = "https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelType=any&maxResults=15&order=relevance&q=%SEARCH%&safeSearch=%SAFE_SEARCH%&videoCaption=any&videoDefinition=any&videoDimension=any&videoDuration=any&videoEmbeddable=any&videoLicense=any&videoSyndicated=any&videoType=any&key=%API_KEY%";
        http.simpleRequest({
            'method': 'GET',
            'url': youtubeApi.replace(/%SEARCH%/gi, encodeURIComponent(args.query)).replace(/%API_KEY%/gi, config.youtube_api_key).replace(/%SAFE_SEARCH%/gi, safeSearch),
            'timeout': 6000,
        }, function (error, response) {
            if (error) {
                engine.log("Error: " + error);
                return;
            }

            if (response.statusCode != 200) {
                engine.log("HTTP Error: " + response.status);
                return;
            }

            var res;
            try {
                res = JSON.parse(response.data.toString());
            } catch (err) {
                engine.log(err.message);
            }

            if (res === undefined) {
                engine.log("Invalid JSON.");
                return;
            }
            let searchResults = [];
            res.items.forEach(element => {
                searchResults.push({
                    name: decodeURIComponent(element.snippet.title),
                    value: `https://youtu.be/${element.id.videoId}`
                });
            });
            backend.extended().createMessage(curChannel, {
                embeds: [
                    {
                        title: "YouTube Search Results",
                        url: `https://www.youtube.com/results?search_query=${args.query}`,
                        description: `Search is limited to 15 results.\n\nSafe search: ${safeSearch}\nQuery: ${args.query}`,
                        fields: searchResults,
                        thumbnail: {
                            url: 'https://cdn.aitsys.dev/file/data/tdnsn3dsk24sg5easq7e/PHID-FILE-e2oz4wdgazmi4ukjlycm/yt_logo_rgb_dark.png'
                        },
                        footer: {
                            text: 'Powered by AITSYS',
                            icon_url: 'https://cdn.aitsys.dev/file/data/5lsinrtil7bfoqhjfzcm/PHID-FILE-y6t5xs7tmtmdj5ynrv6b/logo.jpg'
                        }
                    }
                ]
            });
        });
    });
  })
});
