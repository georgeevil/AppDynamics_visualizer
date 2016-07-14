const async = require('async');
const Graph = require('../models/graphs');
const User = require('../models/User');

/**
 * POST /api/visualizer/save
 * Create a new graph, ajax API call
 */
exports.saveGraph = (req, res) => {
  
  if (!req.user) {
    res.send(JSON.stringify({'valid':'false', 'msg':'You have been signed out, please sign in again (in a different tab if you want to save your current progress).'}));
    return;
  }
  const errors = req.validationErrors();
  if (errors) {
    res.send(JSON.stringify({'valid':'false', 'msg':errors}));
    return;
  }

  var graphConfig;
  var graphName;
  
  try {
    graphConfig = JSON.parse(req.body.graphConfig);
    graphName = req.body.name;
  }
  catch (err) {
    
    res.send(JSON.stringify({'valid':'false', 'msg':err.message}));
    return;
  }
  
  // Add graph info
  var newGraph;
  if (req.body.name != ""){
    newGraph = new Graph({
      name: graphName,
      author: req.user.id,
      config: JSON.stringify(graphConfig)
    });   
  } else {
    newGraph = new Graph({
      author: req.user.id,
      config: JSON.stringify(graphConfig)
    });    
  }

  if (req.body.name == ""){
    delete newGraph.name;
  }

// Verify custom graphID is open, and then save graph + return JSON resp. 
  Graph.findOne({name: graphName}, (err, existingGraph) => {
    
    if (existingGraph&&(req.body.name != "")) {
      res.send(JSON.stringify({'valid':'false', 'msg':'Graph with custom ID already exists.'}));
      return;
    }
    newGraph.save((err) => {
      if (err) { 
         
        if (err.code === 11000) {
          res.send(JSON.stringify({'valid':'false', 'msg':err}));
          return;
        } else {
          res.send(JSON.stringify({'valid':'false', 'msg':err}));
          return;
        }
      } else {
        
        var graphReferenceURL = (newGraph.name == undefined) ? newGraph._id : newGraph.name;
        
        res.send(JSON.stringify({'valid':'true', 'msg':graphReferenceURL})); 
        return;
      }
    });
  });
};

/**
 * GET /visualizer/:graphID
 * Graph view page
 */
exports.viewGraph = (req, res, next) => {
  if (req.params.graphID == ""){
    return res.redirect('/visualizer');
  }
  // Build update page based on Graph ID
  if (req.params.graphID.match(/^[0-9a-fA-F]{24}$/)) {
    Graph.findById(req.params.graphID, (err, graph) => {
      if (err) { return next(err); }

      if (!graph) { 
        // Try searcing by name if ID fails
        Graph.findOne({name: req.params.graphID}, (err, graph) => {
          if (err) { return next(err); }
          if (!graph) { 
            req.flash('errors', { msg: 'Invalid graph ID' });
            return res.redirect('/');
          }
          // Verify user before render
          res.render('visualizer', {
            title: 'View Graph',
            config: graph.config,
            graphId: "http://localhost:8080/visualizer/" + graph.name,
            authorString: "by " + graph.author
          });
        });      
    
      }

      // Verify user before render
      console.log(graph.config);
      res.render('visualizer', {
        title: 'View Graph',
        config: graph.config,
        graphId: "http://localhost:8080/visualizer/" + graph._id,
        authorString: "by " + graph.author
      });
    });
  } else {
       // Try searcing by name if ID fails
    Graph.findOne({name: req.params.graphID}, (err, graph) => {
      if (err) { return next(err); }
      if (!graph) { 
        req.flash('errors', { msg: 'Invalid graph ID' });
        return res.redirect('/visualizer');
      }
      // Verify user before render
      res.render('visualizer', {
        title: 'View Saved Graph',
        config: graph.config,
        graphId: "http://localhost:8080/visualizer/" + graph.name,
        authorString: "by " + graph.author
      });
    });   
  }
};

/**
 * POST /api/visualizer/delete
 * Delete graph.
 * Not currently connected with front-end
 */
exports.deleteGraph = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/');
  }
// Find graph
  Graph.findById(req.body.name, (err, graph) => {
    if (err) { return next(err); }
    // Verify user 
    graph.verifyAuthor(req.user.id, function(isAuthor){
      if (isAuthor) {
        Graph.remove({_id: req.body.name}, (err) => {
          if (err) { return next(err); }
          req.logout();
          req.flash('info', { msg: 'Graph has been deleted.' });
          res.redirect('/');
        });
      } else {
        req.flash('errors', { msg: 'You are not the author of this graph.' });
        res.redirect('/');
       }
    });
  });
};