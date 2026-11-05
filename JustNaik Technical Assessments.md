# Full Stack Location Management Application

*Technical Assessment*

## Objective

Build a complete web application that allows authenticated users to manage and visualize their own location data. Users must be able to add locations manually or through a file upload and view them on an interactive map.

## Application Pages and Navigation

Create four pages: user registration, login, interactive map, and file upload. Provide sidebar navigation with a logout option for seamless movement between pages.

## Authentication and Data Privacy

- Implement JWT based authentication. Protect the map and file upload pages and automatically redirect unauthenticated visitors to the login page.
- Keep location data specific to each user. For example, if User A adds five locations, User B must not be able to see any of those markers.

## Interactive Map

- Use react-leaflet to display an interactive map.
- Provide a form for a location name, latitude, and longitude.
- On submission, instantly display the new location as a clickable marker without refreshing the page.
- Show the location name when its marker is clicked.

## File Upload

- Allow users to upload a single ZIP file containing exactly one text file with location names and latitude and longitude coordinates.
- After a successful upload, display a confirmation popup for three seconds, then automatically add all locations from the file to the user’s map.
- If the ZIP file contains anything other than a single text file, display an error popup for three seconds.

Use the following comma separated format in the .txt file:

```text
Name, Latitude, Longitude
Suria KLCC,3.157324409,101.7121981
Zoo Negara,3.21054160,101.75920504
```

## Technical Specifications

| Area | Requirement |
| --- | --- |
| Frontend | React.js or Next.js with Bootstrap or Tailwind CSS |
| Backend | Node.js and Express.js |
| Database | PostgreSQL or MySQL for data persistence |
| Authentication | JWT based authentication |
| Map library | react-leaflet |
| State management (optional) | Any solution, such as Redux or Zustand |
| Language | JavaScript or TypeScript |

## Deliverables

- Complete source code in a GitHub repository.
- A comprehensive README with clear setup and usage instructions.
- Bonus optional deliverable: a Dockerized backend implementation.

## Evaluation Focus

Working features, clear loading and error states, readable code, and sensible component structure.
