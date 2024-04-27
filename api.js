var express = require('express');
var app = express();
var mysql = require('mysql');
app.use(express.json());
var dbName = "genericDb";
var tableName = "products";

var con = mysql.createConnection({
    host: "localhost",
    user: "root",   
    port: 3306,
    password: ""
});

con.connect((err) =>{
    if (err) throw err;
    console.log("Connected!");
});


app.get('/', (req, res) =>{
    res.sendFile(__dirname + '\\files\\index.html', );
});

app.get('/POST', (req, res) =>{
    const insertQuery = `insert into ${dbName}.${tableName} (name, description, price, image, active) values ('${req.body.name}', '${req.body.description}', ${req.body.price}, '${req.body.image}', ${req.body.active});`;
    con.query(insertQuery, (err, result) =>{
        if(err) throw err;
        res.send(result);
    });
});

app.get('/GetAllProducts', (req, res) =>{
    const selectQuery = `select * from ${dbName}.${tableName};`;
    con.query(selectQuery, (err, result) =>{
        if(err) throw err;
        res.send(result);
    });
});

app.get('/GetProductById', (req, res) =>{
    if(!testId(req.query.id)){
        res.send(`Must include an id, ${req.query.id} is not an id.`);
        return 0;
    }
    var id = parseInt(req.query.id);
    const selectQuery = `select * from ${dbName}.${tableName} where id=${id};`;
    con.query(selectQuery, (err, result) =>{
        if(err) throw err;
        res.send(result);
    });

    
});

app.get('/PATCH', (req, res) =>{
    if(!testId(req.body.id)){
        res.send(`Must include an id, ${req.body.id} is not an id.`);
        return 0;
    }
    var updateQuery = `update ${dbName}.${tableName} set `;
    var idValue = parseInt(req.body.id);
    var updated = false;
    const boolRegex = new RegExp('true|false');
    if(req.body.name != null){
        updateQuery += `name = '${req.body.name}'`;
        updated = true;
    }
    if(req.body.description != null){
        if(updated) updateQuery += ", ";
        updateQuery += `description = '${req.body.description}'`;
        updated = true;
    }
    if(req.body.price != null && !isNaN(parseFloat(req.body.price))){
        if(updated) updateQuery += ", ";
        updateQuery += `price = ${req.body.price}`;
        updated = true;
    }
    if(req.body.image != null){
        if(updated) updateQuery += ", ";
        updateQuery += `image = '${req.body.image}'`;
        updated = true;
    }
    if(req.body.active != null && boolRegex.test(req.body.active)){
        if(updated) updateQuery += ", ";
        updateQuery += `active = ${req.body.active}`;
        updated = true;
    }
    if(!updated){
        res.send("Must update a field");
        return 0;
    }
    updateQuery += ` where id = ${idValue};`;
    con.query(updateQuery, (err, result) =>{
        if(err) throw err;
        res.send(result);
    });
});

app.get('/DELETE', (req, res) =>{
    if(!testId(req.query.id)){
        res.send(`Must include an id, ${req.query.id} is not an id.`);
        return 0;
    }
    const deleteQuery = `delete from ${dbName}.${tableName} where id = ${req.query.id};`;
    con.query(deleteQuery, (err, result) =>{
        if(err) throw err;
        res.send(result);
    });
});
function testId(id){
    if(id == null || isNaN(parseInt(id))){
        return false;
    }
    return true;
}
var server = app.listen(8080, () =>{
    /*
    id int not null primary key AUTO_INCREMENT
    name nvarchar(255) not null
    description nvarchar(255) not null
    price decimal(10, 2) not null
    image nvarchar(65535) not null
    active bool not null
    */
    var createDbQuery = 'CREATE DATABASE IF NOT EXISTS ' + dbName + ';';
    var createTableQuery = 'CREATE TABLE IF NOT EXISTS ' + dbName + '.' + tableName + ' (id int not null primary key AUTO_INCREMENT, name nvarchar(255) not null, description nvarchar(255) not null, price decimal(10, 2) not null, image nvarchar(65535) not null, active bool not null);';
    var checkTableQuery = 'SELECT * from ' + dbName + '.' + tableName;
    var populateTableTemplate = 'INSERT INTO '+ dbName + '.' + tableName + "(name, description, price, image, active) VALUES ('";
    var jsonFile = require(__dirname+"\\files\\dbDefaults.json");

    jsonFile.defaultRows.forEach((element) => console.log(element));

    console.log('Node server booting up\ndoing initial configs/checks');
    con.query(createDbQuery, (err, result)=>{
        if(err) throw err;
        console.log("DB Exists!");
        con.query(createTableQuery, (err, result) =>{
            if(err) throw err;
            console.log("Table Exists!");
            con.query(checkTableQuery, (err, result) =>{
                if(err) throw err;
                if(result.length == 0){
                    jsonFile.defaultRows.forEach((item) => {
                    var populateTable = populateTableTemplate + item.name + "', '" + item.description + "', " + item.price + ", '" + item.image + "', " + item.active + ");";
                    con.query(populateTable, (err, result) =>{
                        if(err) throw err;
                        console.log('Created the ' + item.name + " row!");
                    });
                    });
                } else {
                    console.log("Rows already existed!");
                }
             });
        });
    });
});