var express = require('express')
var expressWS = require('express-ws')
var webSocketStream = require('websocket-stream/stream')
var ffmpeg = require('fluent-ffmpeg')

var mff = new Map()
var app = express()
expressWS(app)
app.ws("/rtsp/:id", handle)
app.listen(8888)


function getffm(url) {
  //const p = new Promise((resolve, reject) => {
  var ffmpegCommand = new ffmpeg(url)
    .addInputOption("-analyzeduration", "100", "-max_delay", "100")
    //.on("start", function () {
    //  console.log(url, "Stream started.");
    //})
    //.on("codecData", function () {
    //  console.log(url, "Stream codecData.")
    //})
    //.on("error", function (err) {
    //  console.log(url, "An error occured: ", err.message);
    //  //stream.end();
    //})
    //.on("end", function () {
    //  console.log(url, "Stream end!");
    //  //stream.end();
    //})
    .outputFormat("flv").videoCodec("copy").noAudio()

  return ffmpegCommand
}

function writeStream(id, url, stream) {
  if (mff.has(id)) {
    ffm = mff.get(id)
    //ffm.videoCodec("copy").noAudio().clone().pipe(stream)
    ffm.clone()
      .on("start", function () {
        console.log(url, "Stream started.");
      })
      .on("error", function (err) {
        console.log(url, "An error occured: ", err.message);
        stream.end();
      })
      .on("end", function () {
        console.log(url, "Stream end!");
        stream.end();
      })
      .pipe(stream)
  } else {
    ffm = getffm(url)
    mff.set(id, ffm)
    ffm.clone()
      .on("start", function () {
        console.log(url, "Stream started.");
      })
      .on("error", function (err) {
        console.log(url, "An error occured: ", err.message);
        stream.end();
      })
      .on("end", function () {
        console.log(url, "Stream end!");
        stream.end();
      })
      .pipe(stream)
  }
}

function handle(ws, req) {
  let url = req.query.url;
  var stream = webSocketStream(ws, {
    binary: true,
  })
  writeStream(req.params.id, req.query.url, stream)
}