const express = require('express');

class WebSite {
    constructor(port=8000){
        this.app = express();
        this.app.use(express.static(__dirname + "/dist"));
        
        
        this.app.all('*', (req, res) => {
            res.sendFile(__dirname + "/dist/index.html");
            this.app.use('/static',express.static('static'))
        });
        
        this.app.listen(port, () => {
            console.log('🌐 ServerWeb en ligne au port ' + port);
        });
}}

module.exports = WebSite;

