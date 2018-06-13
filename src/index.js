let network = null;
let nodes = null;
let edges = null;
let token = null;

let initialState = [];

let map = {}; //TODO move map into initialstate
const TIMEOUT = `100`;

// Called when the Visualization API is loaded.
function drawVisualization() {
    //init
    nodes = new vis.DataSet();
    edges = new vis.DataSet();

    let username = document.querySelector('#userInput').value;
    token = document.querySelector('#userToken').value;
    nodes.add({id: 0, label: username, color: "#ffa366", fixed: true});
    map[0] = "https://github.com/" + username;
    initialState.push({
        id: 0,
        color : "#ffa366"
    });

    getRepositories(username);

    let options = {
        physics: {
            solver: "forceAtlas2Based"
        },
        interaction : {
            selectConnectedEdges: false
        }
    };

    // create our network
    let container = document.getElementById('mynetwork');
    network = new vis.Network(container, {nodes, edges}, options);

    //add listeners
    network.on("doubleClick", handleDoubleClick);
    network.on("click", handleClick)
}

function handleDoubleClick(object) {
    let ids = object.nodes;
    let clickedNodes = nodes.get(ids)[0];
    if (clickedNodes) {
        let url = map[clickedNodes.id];
        if (url) {
            window.open(url, '_blank');
        }
    }
}

function handleClick(object){
    //reset nodes
    let nodeLength = initialState.length;
    for (let i = 0; i < nodeLength; i++) {

        let current = nodes.get(initialState[i].id);
        current.color = {
            background: initialState[i].color
        };

        nodes.update(current);

        let connectedEdges = network.getConnectedEdges(current.id);
        let arrayLength = connectedEdges.length;
        for (let i = 0; i < arrayLength; i++) {
            let current = edges.get(connectedEdges[i]);
            current.arrows = {from : false};
            current.color = null;
            edges.update(current);
        }
    }

    let ids = object.nodes;
    let clickedNode = nodes.get(ids)[0];
    if(clickedNode){
        highlightNode(clickedNode);
        highlightParentChain(clickedNode.id);
    }
}

function highlightParentChain(id){
    let connectedNodes = network.getConnectedNodes(id, 'from');
    let connectedEdges = network.getConnectedEdges(id);

    if(connectedNodes) {
        let arrayLength = connectedNodes.length;
        for (let i = 0; i < arrayLength; i++) {
            let current = nodes.get(connectedNodes[i]);
            highlightParent(current);
            highlightParentChain(current.id);
        }
    }

    if(connectedEdges) {
        let arrayLength = connectedEdges.length;
        for (let i = 0; i < arrayLength; i++){
            let current = edges.get(connectedEdges[i]);

            //add an arrow back if it is in chain.
            if(connectedNodes.indexOf(nodes.get(current.from).id) > -1){
                console.log('paining edge from', current.from, "to", current.to);
                current.arrows = {
                    from: true,
                };
                current.color = {
                    color: '#ff0000'
                };

                edges.update(current);
            }
        }
    }
}
function highlightNode(node){
    console.log('coloring' , node);
    node.color = {
        highlight : {
            background: '#FFA4A1'
        }
    };

    nodes.update(node)
}

function highlightParent(parent){
    parent.color = {
            background: '#FFA4A1'
    };

    nodes.update(parent)
}

function Get(url, options) {
    options = options || {};
    options.headers = {
        Authorization: 'Bearer ' + token
    };

    return fetch(url, options)
        .then(function (response) {
            return response.json();
        });
}

function getRepositories(username) {
    //Retrieve repositories
    Get('https://api.github.com/users/' + username + '/repos')
        .then(function (data) {
            let timeout = TIMEOUT;
            for (let repo of data) {
                //add repo
                setTimeout(function () {
                    nodes.add({id: repo.id, label: repo.name, color: "#b0f2dd"});
                    edges.add({to: repo.id, from: 0, color: {color: "#888888", inherit:false}});
                    map[repo.id] = repo.html_url;
                    initialState.push({
                        id: repo.id,
                        color : "#b0f2dd"
                    });
                    getBranches(repo, username);
                }, timeout);
                timeout += TIMEOUT;
            }
        });
}

function getBranches(repo, username) {
    Get(repo.url + "/branches")
        .then(function (data) {
            //add branch
            let timeout = TIMEOUT;
            for (let branch of data) {
                setTimeout(function () {
                    nodes.add({id: "branch-" + branch.commit.sha, label: branch.name, color: "#c0cfe8"});
                    edges.add({to: "branch-" + branch.commit.sha, from: repo.id, color: {color: "#888888", inherit:false}});
                    map["branch-" + branch.commit.sha] = "https://github.com/" + username + "/" + repo.name + "/tree/" + branch.name;
                    initialState.push({
                        id: "branch-" + branch.commit.sha,
                        color : "#c0cfe8"
                    });
                }, timeout);
                timeout += TIMEOUT;
            }
        });
}
