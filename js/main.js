document.addEventListener("DOMContentLoaded", async function () {

    let user = JSON.parse(localStorage.getItem('foodieUser'));
    let isLoggedin = await validateToken();

    if (isLoggedin) {
        document.querySelector(".container").appendChild(createPostDiv());
    }

    document.getElementById('navBarForm').innerHTML = getNavBar(isLoggedin ? user : null);

    let signup = document.getElementById("signup"),
        login = document.getElementById('login'),
        profile = document.getElementById('profile'),
        logout = document.getElementById("logout");


    if (profile) {
        document.getElementById("profile").addEventListener("click", function () {
            if (isLoggedin) {
                //get placeholder infomation and placed at the profile page

                window.location.href = "profile.html";
            }
        });
    }

    if (logout) {
        document.getElementById("logout").addEventListener("click", function () {
            localStorage.removeItem('foodieUser');
            window.location.href = "index.html";

        })
    }

    if (login && signup) {
        document.getElementById("signup").addEventListener("click", function () {
            window.location.href = "signup.html";
        });


        document.getElementById("login").addEventListener("click", function () {
            let email = document.getElementById("emailInput").value;
            let password = document.getElementById("passwordInput").value;

            if (!(email && password)) {
                alert("Please fill all the fields!!!")
            } else {
                // fetch('http://localhost:8080/congnizantp2_war/user/login', {
                fetch('http://localhost:8080/users/login', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "username": email,
                        "password": password
                    })
                }).then(r => r.json())
                    .then(res => {
                        localStorage.setItem("foodieUser", JSON.stringify(res));
                        window.location.reload();
                    }).catch(e => {
                    console.log(e);
                })
            }
        });
    }


    function getNavBar(userName) {
        return userName ?

            `                <button type="button" id = "profile" class="btn btn-primary mr-sm-2">${user.username}</button>
                            <button type="button" id="logout" class="btn btn-danger">Logout</button>

` :
            `
    <input id="emailInput" class="form-control mr-sm-2" type="text" placeholder="Email">
                <input id= "passwordInput" class="form-control mr-sm-2" type="password" placeholder="Password">
                <button type="button" id = "login" class="btn btn-success mr-sm-2">Login</button>
                <button type="button" id = "signup" class="btn btn-success">Sign up</button>
    `;
    }


    // fetch('http://localhost:8080/congnizantp2_war/post/list')
    fetch('http://localhost:8080/posts/all')
        .then(res => res.json())
        .then(async posts => {
            for (let i = posts.length - 1; i >= 0; i--) {
                let div = document.createElement('div');
                let comments = [];
                await fetch(`http://localhost:8080/congnizantp2_war/post/${posts[i].postId}/comment`)
                    .then(res => res.json())
                    .then(comnts => {
                        comments = comnts;
                    })


                div.innerHTML = postDiv(posts[i], comments);
                document.querySelector('.container').appendChild(div);

            }
        });


    function postDiv(post, comments = []) {
        return `
        <div class="card post-card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12">
                        <p>
                            <a class="float-left text-primary"><strong>${post.userName}</strong></a>
                        </p>
                        
                        <div class="clearfix"></div>
                        <h5>
                            <a class="float-left text-secondary"><strong>${post.title}</strong></a>

                        </h5>
                        <div class="clearfix"></div>
                        <p>${post.postText}</p>
                        <p>
                        ${
            user && user.username === post.userName ?
                '<a class="float-right text-white btn btn-danger ml-2 deletePostButton mb-sm-2" onclick="deletePost(this)" id="post-' + post.postId + '">Delete Post</a>'
                : ''
        }
                        
                            </p>
                    </div>
                </div>
                ${isLoggedin ? createCommentDiv(post) : ""}
                ${
            comments.map(comment => commentDiv(comment)).reverse().join('')
        }
                
        </div>
<div/>`;

    }

    function commentDiv(comment) {
        console.log(comment);
        return `
<div class="card comment-card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12">
                                <p><a class="text-primary"><strong>${comment.username}</strong></a></p>
                                <p>${comment.commentText}</p>
                                <p>
                                ${
            user && user.username === comment.username ?
                '<a class="float-right btn text-white btn-danger deleteCommentButton" onclick="deleteComment(this)" id="comment-' + comment.commentId + '">Delete Comment</a>'
                : ''
        }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
`
    }

    function createPostDiv() {
        let div = document.createElement("div");
        div.innerHTML = `    
            <div class="card post-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <h5>
                                Create a post
                            </h5>
            
                            <div class="input-group mb-3">
                            <div class="input-group-prepend">
                            <span class="input-group-text" id="basic-addon3">Title</span>
                            </div>
                            <input type="text" class="form-control" aria-describedby="basic-addon3" id="createPostInputTitle">
                            </div>
                            
                            <div class="input-group">
                            <div class="input-group-prepend">
                              <span class="input-group-text">Description</span>
                            </div>
                            <textarea class="form-control" aria-label="With textarea" id="createPostDescription"></textarea>
                            </div>
                            
                            <div>
                            <button id = "createPost" class="btn btn-primary mt-sm-4 float-right" onclick="createPost()">Post</button>
                            </div>
            
                        </div>
                    </div>
                </div>
            </div>`

        return div;
    }

    function createCommentDiv(post) {
        return `
    <div class="input-group">
        <div class="input-group-prepend">
            <span class="input-group-text">Comment</span>
         </div>
        <textarea class="form-control" aria-label="With textarea" id="comment-text-area-${post.postId}"></textarea>
    </div>
  
    <div>
        <button id = "post-button-${post.postId}" class="btn btn-primary mt-sm-4 float-right" onclick="postComment(this)">Comment</button>

    </div>
    <div class="clearfix"></div>
    `
    }

    async function validateToken() {
        if (user) {
            let token = user.token;
            let r = await fetch('http://localhost:8080/congnizantp2_war/post', {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            })
                .catch(e => console.log(e))
            return r.status === 200;
        }

    }
});

function createPost() {
    let title = document.getElementById('createPostInputTitle').value,
        desc = document.getElementById('createPostDescription').value,
        user = JSON.parse(localStorage.getItem('foodieUser'));
    fetch('http://localhost:8080/congnizantp2_war/post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
            "title": title,
            "postText": desc
        })
    }).then(r => {
        if (r.status === 200) {
            window.location.reload();
        }
    })
}


function postComment(post) {
    console.log(post);
    let postId = post.id.split('-')[2];
    let commentText = document.getElementById(`comment-text-area-${postId}`).value;
    let user = JSON.parse(localStorage.getItem('foodieUser'));
    fetch(`http://localhost:8080/congnizantp2_war/comment/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
            "commentText": commentText
        })
    }).then(r => {
        if (r.status === 200) {
            window.location.reload();
        }
    })
}

function deletePost(post) {
    console.log(post);
    let id = post.id.split('-')[1],
        user = JSON.parse(localStorage.getItem('foodieUser'));
    fetch(`http://localhost:8080/congnizantp2_war/post/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
    }).then(r => {
        if (r.status === 200) {
            window.location.reload();
        }
    })
}

function deleteComment(comment) {
    let id = comment.id.split('-')[1],
        user = JSON.parse(localStorage.getItem('foodieUser'));
    fetch(`http://localhost:8080/congnizantp2_war/comment/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
    }).then(r => {
        if (r.status === 200) {
            window.location.reload();
        }
    })
}





