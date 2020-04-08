const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("DATABASE", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//Item Schema para los items de la lista default

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

//Los 3 items default que se agregan a todas las listas

item1 = new Item({
  name: "Bienvenido"
});

item2 = new Item({
  name: "Para agregar tareas presione el +"
});
item3 = new Item({
  name: "Para Borrarlas presione el checkbox <--"
});

const defaultItems = [item1, item2, item3];

//List Schema para las listas personalizadas

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  //Homepage
  //se trae todos los items, si el largo de la lista es igual a 0, se cargan los 3
  // de default seteados anteriormente
  Item.find({}, function (err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);

        } else {
          console.log("Items por defecto agregados satisfactoriamente");
        }
      });
      //una vez seteados se dirige a si misma para pasar por el else 
      res.redirect("/");
    } else {
      //se renderiza la pagina en la plantilla EJS llevandose el nombre de la lista y los items
      res.render("list", {
        listTitle: "Home",
        newListItems: result
      });
    }
  });


});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  //se toma el nombre del item insertado en el form y el nombre de la lista en la que se localizara
  const item = new Item({
    name: itemName
  });
  //si este item se busca localizar en el home:
  if (listName === "Home") {

    item.save(function (err) {
      if (err) {
        console.log(err);

      } else {
        console.log("Item Agregado Con exito");
        res.redirect("/");
      }
    });
  } else {
    //en caso de que no sea el Home, se busca la lista que tenga el mismo nombre ingresado
    List.findOne({
      name: listName
    }, function (err, foundList) {
      if (err) {
        console.log(err);

      } else {
        //una vez encontrado, se hace el push del nuevo item a la lista y se guarda
        //la lista modificada en la base de datos
        foundList.items.push(item);
        foundList.save();
        //se redirige a la pagina personalizada de la lista EJ: LocalHost:3000/Trabajo
        res.redirect("/" + listName);
      }
    });
  }

});


app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;
  //se toma el nombre del item que se quiere borrar justo a la lista donde se encuentra
  //si este item pertenece a la pagina Home:
  if (listName === "Home") {

    Item.findByIdAndRemove(itemId, function (err) {
      if (err) {
        console.log(err);

      } else {
        console.log("El item se borro con exito");
        res.redirect("/");
      }
    });
  } else {
    //en caso de que no sea en el home, se realiza un Query para buscar la lista a la que pertenece
    //y sacar el item de su respectivo Array
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: itemId
        }
      }
    }, function (err, foundList) {
      if (!err) {
        //si no hubo problemas, se redirige al sitio de la lista personalizada
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }
    })
  }


});

app.get("/:customLista", function (req, res) {
  //Si al entrar a la pagina se modifica la ruta EJ Localhost:3000/TareasUniversidad
  //Se entra a este get
  //Se utiliza la libreria Lodash para que la primera letra de la lista siempre
  //este en mayusculas, de este modo exista una sola lista para "work" y "Work"
  const parametroLista = _.capitalize(req.params.customLista);

  //pagina secreta
  if (parametroLista === "About") {
    res.render("about");
  } else {

    //se busca la lista que coincide con el nombre recibido
    List.findOne({
      name: parametroLista
    }, function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //si no se encuentra una lista con ese nombre, se la crea
          const list = new List({
            name: parametroLista,
            items: defaultItems
          });
          list.save();
          //se vuelve a redirigir al mismo caso para que se renderize la lista actual
          res.redirect("/" + parametroLista);
        } else {
          //si la lista si existe en la DB se renderiza en el EJS correspondiente
          res.render("list", {
            listTitle: parametroLista,
            newListItems: foundList.items
          });
        }
      } else {
        console.log(err);

      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
  console.log("Server started on port: " + port);
});