var express = require('express')
var expressWS = require('express-ws')
var webSocketStream = require('websocket-stream/stream')
var ffmpeg = require('fluent-ffmpeg')

var mff = new Map()
var app = express()
expressWS(app)
app.ws("/rtsp/:id", handle)
app.listen(50000)


function getffm(url) {
  //const p = new Promise((resolve, reject) => {
  var ffmpegCommand = new ffmpeg(url)
    .addInputOption("-rtsp_transport", "tcp", "-buffer_size", "1024000", "-max_delay", "500000", "-stimeout", "20000000", "-analyzeduration", "1000", "-max_delay", "1000") // buffer_size 提高画质，减少花屏现象
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
  let url = decodeURIComponent(req.query.url);
  var stream = webSocketStream(ws, {
    binary: true,
  })
  console.log(req.params.id, req.query.url)
  writeStream(req.params.id, req.query.url, stream)
}
