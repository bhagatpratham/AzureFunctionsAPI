# Azure Functions Video Generator API

This Azure Functions API generates a video from a list of image URLs provided by the user.

**Endpoint:** http://VideoGenerator.azurewebsites.net/api/VideoGenerator

**HTTP Method:** POST

**Request Body:**

```{
    "imageUrls": [
        "URL1",
        "URL2",
        "URL3"
    ]
}
```

**Query Parameters:**

- _time_in_between (optional):_ Time delay between each image in the generated video (in seconds). Default is 1 second.
  Response: The API responds with the status of the video generation process.

## Running the Function

Send an HTTP POST request with the following JSON payload structure:

```
{
    "imageUrls": [
        "https://cdn.dribbble.com/userupload/9166025/file/original-4d4947856d33041c79ff6ff967fc1ef0.png",
        "https://e0.365dm.com/22/09/2048x1152/skysports-premier-league-promo_5897092.png",
        "https://cdn.dribbble.com/userupload/9166024/file/original-75878ae4dac1b11c6957f32493faba0d.png"
    ]
}
```

Optionally, you can include the query parameter time_in_between to set the time delay between images in the generated video.

After invoking the function, it will generate a video using the provided image URLs. The generated video will be available as "output.mp4" in the Azure Function's execution context directory.

### Error Handling

The function includes error handling for scenarios such as invalid image URLs, network errors, and unsupported file formats. In case of any error, the function will return an appropriate response with an error message.
