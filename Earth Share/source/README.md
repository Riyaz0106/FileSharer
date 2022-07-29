# **Earth Share - DWT Project**

**Application Name:** Earth

**Application Type:** Web-based

**Application Goal:** To fully demonstarte the capabilities of webservices and api's.
***
## **Getting Started**

In order to successfully run the application please follow the steps below.
***

>**Step 1:** Nodejs Setup

1. Download and install [Nodejs](https://nodejs.org/en "Nodejs") software from the official Nodejs website .

2. Make sure the `npm` folder is set in environment variable's path variable.

>**Step 2:** GeckoDriver Setup.

1. At this page https://github.com/mozilla/geckodriver/releases, Select the appropriate version for GeckoDriver download based on your operating system.

2. Extract the ZIP file. Once the ZIP file download is complete, extract the contents of `ZIP File onto a file folder`.

3. Note the location where you extracted the driver. Location will be used later to instantiate the driver.

4. Set the location of the gecko driver to the environment variables in `Path` under `user variables`.

>**Step 3:** Install Mozilla firefox.

1. Make sure you have latest version of mozilla firefox installed. If not install it from the official website.

>**Step 4:** Mysql Database Setup

1. Download and install Mysql server. For instructions, refer to the Mysql documentation on [MYSql](https://dev.mysql.com/ "Mysql").

2. After setting up Mysql server use the `sql` files inside `database` folder to import all the tabels.

3. The sql file consists of all create table queries.

4. It also consists of queries to create all required events, procedures and functions.

5. Open `config.js` file in the `source` folder and set the username and password of the database in username and password fields.

>**Step 5:** Config WTC login

1. Open `configWTC.js` file in the `source` folder and set your TUC login credentials in the username and password fields.

>**Step 6:** Start the app by Run the following commands from the `source` directory

```sh
npm install

npm start
```