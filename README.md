# Azure Functions Video Generator API

This Azure Functions API generates a video from a list of image URLs provided by the user.

**Endpoint:** http://VideoGenerator.azurewebsites.net/api/VideoGenerator

**HTTP Method:** POST

**Request Body:** N/A

**Query Parameters:**

- _time_in_between (optional):_ Time delay between each image in the generated video (in seconds). Default is 1 second.
  Response: The API responds with the status of the video generation process.
