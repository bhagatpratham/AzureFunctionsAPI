const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

// Azure Function entry point
module.exports = async function (context, req) {
  try {
    // Log that the function has been triggered
    context.log(
      "HTTP trigger function for video generation processed a request."
    );

    // List of image URLs for the video
    const imageUrls = [
      "https://i.pinimg.com/736x/d4/9e/1e/d49e1e4bd32eb7281b50115ac938dcfb.jpg",
      "https://e0.365dm.com/22/09/2048x1152/skysports-premier-league-promo_5897092.png",
      "https://i.pinimg.com/736x/8d/87/a2/8d87a2aca6816f9fdd0cc57772f565f0.jpg",
    ];
    const timeInBetween = parseFloat(req.query.time_in_between) || 1.0; // Default to 1 second

    // Validate imageUrls input
    if (!imageUrls || !Array.isArray(imageUrls)) {
      context.res = {
        status: 400,
        body: "Invalid input. Provide an array of image URLs in the request body.",
      };
      context.done();
      return;
    }

    // Create a temporary directory for storing images
    const tempDir = path.join(
      context.executionContext.functionDirectory,
      "temp"
    );
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Download and save images from imageUrls
    const downloadedImages = [];
    for (const imageUrl of imageUrls) {
      try {
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const imageName = path.basename(imageUrl);
        const imagePath = path.join(tempDir, imageName);
        fs.writeFileSync(imagePath, response.data);
        downloadedImages.push(imagePath);
      } catch (error) {
        context.log(`Error downloading ${imageUrl}: ${error.message}`);
      }
    }

    // Check if any images were successfully downloaded
    if (downloadedImages.length === 0) {
      context.res = {
        status: 500,
        body: "Failed to download any images.",
      };
      context.done();
      return;
    }

    // Generate video using downloaded images
    const outputVideoPath = path.join(tempDir, "output.mp4");

    const ffmpegCommand = ffmpeg();
    for (const imagePath of downloadedImages) {
      ffmpegCommand.input(imagePath);
    }

    // Run the ffmpeg command to create the video
    await new Promise((resolve, reject) => {
      ffmpegCommand
        .inputOptions(`-framerate ${1 / timeInBetween}`)
        .output(outputVideoPath)
        .on("end", () => {
          context.log("Video generation successful.");
          resolve();
        })
        .on("error", (err) => {
          context.log.error("Error generating video:", err.message);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    // Handle any errors that occur during the process
    context.log.error("An error occurred:", error.message);
    context.res = {
      status: 500,
      body: "An error occurred: " + error.message,
    };
    context.done();
  }
};
