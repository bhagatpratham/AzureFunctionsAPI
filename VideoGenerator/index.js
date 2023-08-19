const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function (context, req) {
  try {
    context.log(
      "HTTP trigger function for video generation processed a request."
    );

    const imageUrls = req.body.imageUrls;
    const timeInBetween = parseFloat(req.query.time_in_between) || 1.0;

    // Checking if valid image URLs are provided
    if (!imageUrls || !Array.isArray(imageUrls)) {
      context.res = {
        status: 400,
        body: "Invalid input. Provide an array of image URLs in the request body.",
      };
      return;
    }

    // Download and save images
    const downloadedImages = await Promise.all(
      imageUrls.map(async (imageUrl, index) => {
        try {
          context.log("Downloading Image:", imageUrl);
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });
          const imageName = `img00${index + 1}.png`;
          const imagePath = path.join(imageName);
          await fs.writeFile(imagePath, response.data);
          context.log("Image Successfully Downloaded:", imagePath);
          return imagePath;
        } catch (error) {
          context.log(`Error downloading ${imageUrl}: ${error.message}`);
          return null;
        }
      })
    );
    context.log("Downloaded Images:", downloadedImages);

    // Output video path
    const outputVideoPath = "output.mp4";
    const inputPattern = "img%03d.png";
    // FFmpeg command for video generation
    let ffmpegCommand = ffmpeg();

    ffmpegCommand
      .addInput(inputPattern)
      .addInputOption("-framerate 20")
      .inputOptions(["-framerate", `1/${timeInBetween}`])
      .output(outputVideoPath)
      .run();
  } catch (error) {
    context.log.error("An error occurred:", error.message);
    context.res = {
      status: 500,
      body: "An error occurred: " + error.message,
    };
  }
};
