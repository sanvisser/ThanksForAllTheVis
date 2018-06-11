let network = null;
let nodes = null;
let edges = null;
let token = null;

let map = {};
const TIMEOUT = 250;

// Called when the Visualization API is loaded.
function drawVisualization() {
    //init
    nodes = new vis.DataSet();
    edges = new vis.DataSet();

    let username = document.querySelector('#userInput').value;
    token = document.querySelector('#userToken').value;
    nodes.add({id: 0, label: username, color: "#ffa366"});
    map[0] = "https://github.com/" + username;

    getRepositories(username);

    let options = {
        physics: {
            solver: "forceAtlas2Based"
        }
    };

    // create our network
    let container = document.getElementById('mynetwork');
    network = new vis.Network(container, {nodes, edges}, options);
    network.on("doubleClick", handleClick);
}

function handleClick(object) {
    let ids = object.nodes;
    let clickedNodes = nodes.get(ids)[0];
    if (clickedNodes) {
        let url = map[clickedNodes.id];
        if (url) {
            window.open(url, '_blank');
        }
    }
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
                    edges.add({to: repo.id, from: 0});
                    map[repo.id] = repo.html_url;
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
                    edges.add({to: "branch-" + branch.commit.sha, from: repo.id});
                    map["branch-" + branch.commit.sha] = "https://github.com/" + username + "/" + repo.name + "/tree/" + branch.name;
                }, timeout);
                timeout += TIMEOUT;
            }
        });
}
