# Game API Server

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env` (or use the default one provided)
3. Run `npm run start` or `npm run debug` to start the server
4. The server will be accessible on `http://localhost:4941`

### Database Setup

The application uses SQLite by default, which is automatically set up when you start the server. The database file will be created at `./storage/game_api.db` and populated with sample data on first run.

### `.env` file

Create a `.env` file in the root directory of this project with the following information:

```
# Database Configuration

# Database type (sqlite or mysql)
DB_TYPE=sqlite

# SQLite Configuration
SQLITE_DB_PATH=./storage/game_api.db

# MySQL Configuration (only used if DB_TYPE=mysql)
SENG365_MYSQL_HOST=localhost
SENG365_MYSQL_USER=root
SENG365_MYSQL_PASSWORD=your_password_here
SENG365_MYSQL_DATABASE=game_api
SENG365_MYSQL_PORT=3306

# Server Configuration
PORT=4941
```

### Switching to MySQL (Optional)

If you prefer to use MySQL instead of SQLite:

1. Install MySQL server locally
2. Create a database named `game_api` in your MySQL server
3. Update the `.env` file to set `DB_TYPE=mysql` and configure your MySQL credentials
4. Start the server as normal - it will initialize the MySQL database on first run

## Some notes about endpoint status codes

The api spec provides several status codes that each endpoint can return. Apart from the 500 'Internal Server Error'
each of these represents a flow that may be tested. Hopefully from the labs you have seen these status codes before and
have an understanding of what each represents. A brief overview is provided in the table below.

| Status Code | Status Message | Description                                    | Example                                                     |
|:------------|----------------|------------------------------------------------|-------------------------------------------------------------|
| 200         | OK             | Request completed successfully                 | Successfully get games                                      |
| 201         | Created        | Resources created successfully                 | Successfully create game                                    |
| 400         | Bad Request    | The request failed due to client error         | Creating a game without a request body                      |
| 401         | Unauthorised   | The requested failed due invalid authorisation | Creating a game without authorisation header                |
| 403         | Forbidden      | The request is refused by the server           | Creating a game using an existing name                      |
| 404         | Not Found      | The requested item does not exist              | Trying to find information about a game that doesn't exist  |

## Final notes

The Bruno collection provided in `/bruno_test_suite` is a subset of tests/requests that you will be marked against so passing these tests should be your highest priority.
You are more than welcome to add your own tests/requests to the collection provided to increase your testing coverage, however it is a good idea to also validate any new tests against the reference server to ensure you are expecting the right outcome.

If you find an inconsistency or issue with the reference server please reach out to the SENG365 shared mailbox `seng365@canterbury.ac.nz`.
