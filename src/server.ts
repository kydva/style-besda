import app from './app'

const port = app.get("port")

const server = app.listen(app.get("port"), () => {
    console.log(`App is running at http://localhost:${port}`);
});

export default server;
