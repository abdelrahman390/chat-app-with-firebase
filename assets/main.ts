
// import './main.js';
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { query, equalTo, get, child , getDatabase, ref, set, remove, onChildAdded, onChildRemoved , onChildChanged, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

interface Module {
    sendMsg: (message: string, receiver: string) => void;
    sendUsers: (userName: string, password: string | number) => void;
    chatsContainer: (chatId: string | number, message: string, receiver: string) => void;
    // chatId, message, receiver
}
const module: Partial<Module> = {};  // Declare module with 

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZTDHJyKOpPtc6QV4mISVS8JDzYg7W5nA",
    authDomain: "chat-app-7742a.firebaseapp.com",
    projectId: "chat-app-7742a",
    storageBucket: "chat-app-7742a.appspot.com",
    messagingSenderId: "812879044915",
    appId: "1:812879044915:web:e61340195cb8523ec65e46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

    // variables
    var msgTxt = document.querySelector('main .container > .right .send_message input');
    var sendButton = document.querySelector('main .container > .right .send_message img');
    var sender;
    let before_login: Element | null = document.querySelector(".before_login");
    let ChangeLoginPageButton = document.querySelector(".container > .Register");
    let loginBox = document.querySelector(".logIn");
    let registerBox = document.querySelector(".register");
    let registerLogin = document.querySelector(".logIn form");
    let registerForm = document.querySelector(".register form");
    let user = sessionStorage.getItem("sender");
    let allUsers = [];
    let allMessages = [];
    let allowed = false;
    let loginInput = document.querySelectorAll("main .container .before_login .container .box .cont input");
    let loginButton = document.querySelector("main .container .before_login .container .box  .login_button");
    let registerButton = document.querySelector("main .container .before_login .container .box  .register_button");
    let friendsList = document.querySelector("main .container > .left .friends");
    let logoutButton = document.querySelector("main .container .logout");

    if(sessionStorage.getItem('sender') !== null){
        sender = sessionStorage.getItem('sender');
    } 

    if(sendButton != null){
        sendButton.addEventListener("click", function() {
            // TO SEND MESSAGES
            module.sendUsers()
        })
    }



    // send users to database
    module.sendUsers = function sendUsers(userName, password){
        console.log(password)
        var timestamp = new Date().getTime();
        var BigDate = new Date()
        var date = BigDate.toLocaleString()
        set(ref(db,"users/"+timestamp),{
            user_name : userName,
            password : password,
            date: date
        })
    }


    // send message to database
    module.sendMsg = function sendMsg(message, receiver){
        var msg = message;
        var timestamp = new Date().getTime();
        set(ref(db,"messages/"+timestamp),{
            msg : msg,
            sender : sender,
            receiver : receiver
        })
    }

    // send users to database
    module.chatsContainer = function chatsContainer(chatId, message, receiver){
        var msg = message;
        sender = sessionStorage.getItem('sender');
        var BigDate = new Date()
        var date = BigDate.toLocaleString()
        var timestamp = new Date().getTime();
        set(ref(db,`chats/${+chatId}/` + timestamp),{
            msg : msg,
            sender : sender,
            receiver : receiver,
            date : date
        })

    }

// get users
onValue(ref(db, 'users'), (snapshot) => {
    sessionStorage.setItem("all_users", JSON.stringify(snapshot.val()))
}, {
    onlyOnce: true
});

// get every chat messages
function getChatsMessages() {
    onValue(ref(db, 'chats'), (snapshot) => {
        let sender = sessionStorage.getItem('sender')
        let allChats = {};
        for (const key in snapshot.val()) {
            let messageData = Object.values(snapshot.val()[key])[0]
            console.log(messageData)
            if (sender == messageData.sender || sender == messageData.receiver){
                allChats[key] = snapshot.val()[key]
            }
        }
        sessionStorage.setItem("chats", JSON.stringify(allChats))

        if (allowed){
            viewMessages()
        }
    }, {
        onlyOnce: true
    });
}


function CHeckIfAnyChangesInChatsListener(){
    onChildAdded(ref(db, `chats/${sessionStorage.getItem("opened_chat")}`) , (snapshot) => {
        if (allowed){
        const newChat = snapshot.val();
        // console.log('New user chat:', newChat);
        getChatsMessages()
    }
    });
}
CHeckIfAnyChangesInChatsListener()


/************** GET NEW USERS WHEN SIGH UP *************/ 
function waitForNewUser() {
    return new Promise((resolve, reject) => {
        onChildAdded(ref(db, `users`), (snapshot) => {
            const newUserKey = snapshot.key; // Get the key of the new user
            const newUserData = snapshot.val(); // Get the data of the new user

            // Resolve the Promise with an object containing both the key and the data
            resolve({ key: newUserKey, data: newUserData });
        }, (error) => {
            reject(error);  // Handle any errors that occur
        });
    });
}

async function handleNewUser() {
    try {
        const newUser: any = await waitForNewUser();  // Wait for the Promise to resolve
        // console.log('New user key:', newUser.key); // 1725300481565
        // console.log('New user data:', newUser.data); //{"date": "9/2/2024, 9:08:01 PM","password": "","user_name": "ttrttevfggf" }

        let newUserKey = newUser.key
        let newUserData = newUser.data
        let newUserUserName = newUser.data.user_name
        let ullUsersAfterUpdate = JSON.parse(sessionStorage.getItem("all_users"))

        ullUsersAfterUpdate[newUserKey] = newUserData
        
        sessionStorage.setItem("sender_id", newUserKey)
        sessionStorage.setItem("sender", newUserUserName)
        sessionStorage.setItem("all_users", JSON.stringify(ullUsersAfterUpdate))

        handleFriendsList(ullUsersAfterUpdate)
    } catch (error) {
        console.error('Error waiting for new user:', error);
    }
}
/************** GET NEW USERS WHEN SIGH UP *************/ 


/********************* login and register page and logout handle *********************/ 
//  check if loggedIn
function checkIfLogged(check: string | boolean) {
    // if not logged in
    if(check == null || check == "null" || check == false){
        sessionStorage.setItem("loggedIn", false)
        before_login.style = "display: flex"
    // if logged in
    } else if(check === true || (check !== null || check !== "null")) {
        let sender = sessionStorage.getItem('sender')
        sessionStorage.setItem("loggedIn", true)
        before_login.style = "display: none"
        handleFriendsList(JSON.parse(sessionStorage.getItem("all_users")))
        handleChat()
        getChatsMessages() 
    }
}
checkIfLogged(sender)

// login and register handle
function loginAndRegister() {
    let all_users = JSON.parse(sessionStorage.getItem('all_users'))

    // handle hide and show password
    let hidePassword = document.querySelectorAll("main > .container .before_login > .container .box form .cont .container img")
    hidePassword.forEach(element => {
            element.addEventListener("click", function() {
                // console.log(element.parentElement.querySelector("input"))
                let input = element.parentElement.querySelector("input")
                if(input.type == "text"){
                input.type = "password"
                } else{
                    input.type = "text"
                }
            })
    });

    /************** register **************/ 
    let registerCard = document.querySelector("main .container .before_login .container .register");
    let registerForm = document.querySelector(".register form");
    let userName = registerCard.querySelector(".container .before_login .container .box .cont  .name")
    let password = registerCard.querySelector(".container .before_login .container .box .cont  .password")
    let confirmPassword = document.querySelector(".container .before_login .container .box .cont  .confirm_password")
    let registrationPasswordAlarm = document.querySelector(".container .before_login .container .box.register .cont .alarm.password")
    let registrationUserNameAlarm = document.querySelector(".container .before_login .container .box.register .cont .alarm.userName")
    let passwordCheck = false;

    // check password
    confirmPassword.addEventListener("input", function() {
        if(password.value.length <= confirmPassword.value.length & confirmPassword.value !== password.value){
            registrationPasswordAlarm.style.cssText = 'display: block; background: #f29999;'
            confirmPassword.style.cssText = "background-color: #f29999;"
            passwordCheck = false
        } else if(confirmPassword.value == password.value){
            registrationPasswordAlarm.style.display = 'none'
            confirmPassword.style.cssText = "background-color: #1296d1;"
            passwordCheck = true
        }
    })
    // send new user
    registerButton.addEventListener("click", function() {
        let allCheck = userName.value.length > 2 & passwordCheck & registerForm.checkValidity(); // return boolean 
        let userExists = false;
        for (const key in all_users) {
            // Check if the username matches
            if (userName.value === all_users[key].user_name) {
                userExists = true;  // Set flag if the user exists
                registrationUserNameAlarm.classList.add("open")
                break;  // Stop the loop if a match is found
            } else {
                registrationUserNameAlarm.classList.remove("open")
            }
        }
        if (!userExists && allCheck) {
            module.sendUsers(userName.value, password.value);
            handleNewUser();
            sessionStorage.setItem("loggedIn", true);
            sessionStorage.setItem("sender", userName.value);
            sessionStorage.setItem("sender_id", key);
            checkIfLogged(true);
            userName.value = "";
            password.value = "";
            confirmPassword.value = "";
            ChangeLoginPageButton.click();
        } 
    })

    /************** login **************/ 
    let userNameInput = document.querySelector(".before_login .container .box form .cont .name")
    let passwordInput = document.querySelector(".before_login .container .box form .cont .password")
    let loginAlarm = document.querySelector(".container .before_login .container .box.logIn .cont .alarm")

    loginButton.addEventListener("click", function() {
        for (const key in all_users) {
            if(userNameInput.value == all_users[key].user_name & passwordInput.value == all_users[key].password){
                loginAlarm.classList.remove("open")
                sessionStorage.setItem("loggedIn", true)
                sessionStorage.setItem("sender", userNameInput.value)
                sessionStorage.setItem("sender_id", key)
                checkIfLogged(true)
                userNameInput.value = ""
                passwordInput.value = ""
                return
            } else if(userNameInput.value.length > 0 & passwordInput.value.length > 0){
                // error
                loginAlarm.classList.add("open")
            }
        }
    })
}
loginAndRegister() 

// register button handle
ChangeLoginPageButton.addEventListener("click", function() {
    if(loginBox.style.display == "none"){
        loginBox.style = 'display: flex'
        registerBox.style = 'display: none'
        ChangeLoginPageButton.innerHTML = 'Register'
    } else {
        loginBox.style = 'display: none'
        registerBox.style = 'display: flex'
        ChangeLoginPageButton.innerHTML = 'Login'
    }

})

// logout button handle
logoutButton.addEventListener("click", function() {
    sessionStorage.setItem("loggedIn", false)
    sessionStorage.setItem("sender", null)
    sessionStorage.setItem("sender_id", null)
    sessionStorage.setItem("receiver", null)
    checkIfLogged(false)
})
/********************* login and register page handle *********************/ 


/********************* handle friends list *********************/ 
function handleFriendsList(users) {
    console.log(users)
    // let AllUsers = JSON.parse(sessionStorage.getItem("all_users"))
    let addedFriends = []
    let friendsList = document.querySelector("main .container > .left .friends");
    let sender = sessionStorage.getItem("sender")
    // console.log(sender)
    friendsList.innerHTML = ""
    for  (const key in users) {
        console.log(users[key].user_name)
        console.log(sessionStorage.getItem("sender"))
        if(users[key].user_name != sessionStorage.getItem("sender") && sessionStorage.getItem("sender") !== (null || "null")){

            // console.log(friendsList)
            addedFriends.push(users[key].user_name)

            let friend = document.createElement("div")
            friend.classList = "friend"
            friend.setAttribute("id", key)
        
            let userPhoto = document.createElement("img")
            userPhoto.classList = "user_photo"
            userPhoto.src = "assets/imgs/user.png"
            
            let cont = document.createElement("div")
            cont.classList = "cont"
        
            let h1 = document.createElement("h1")
            h1.classList = "name"
            h1.innerHTML = users[key].user_name
    
            // let h2 = document.createElement("h2")
            // h2.classList = "last-message"
        
            cont.appendChild(h1)
            friend.appendChild(userPhoto)
            friend.appendChild(cont)
            friendsList.appendChild(friend)

        }
    }

    sessionStorage.setItem("addedFriends" , JSON.stringify(addedFriends))
}

/********************* handle chat *********************/ 
// handle open chat
function handleChat() {
    let chatBox = document.querySelector("main .container > .right");
    let friendsList = document.querySelectorAll("main .container > .left .friends .friend");
    chatBox.innerHTML = ""

    friendsList.forEach(element => {
            element.addEventListener("click", function() {
                sessionStorage.setItem("receiver", element.querySelector(".name").innerHTML)
                let receiverLastFourNums = element.getAttribute("id").slice(-2);
                let senderLastFourNums = sessionStorage.getItem("sender_id").slice(-2)
                let chatId = +receiverLastFourNums + +senderLastFourNums;
                sessionStorage.setItem("opened_chat", chatId)
                chatBox.innerHTML = ""

                // Creating the header
                const header = document.createElement('header');

                // Left part of the header
                const leftDiv = document.createElement('div');
                leftDiv.className = 'left';
                
                const userImg = document.createElement('img');
                userImg.src = 'assets/imgs/user.png';
                userImg.alt = 'user-photo';
                
                const userCont = document.createElement('div');
                userCont.className = 'cont';

                const userName = document.createElement('h1');
                userName.className = 'name';
                userName.innerHTML = element.querySelector("main .container > .left .friends .friend .cont .name").innerHTML
                
                
                userCont.appendChild(userName);
                leftDiv.appendChild(userImg);
                leftDiv.appendChild(userCont);
                
                // Right part of the header
                const rightDiv = document.createElement('div');
                rightDiv.className = 'right';
                
                const searchImg = document.createElement('img');
                searchImg.src = 'assets/imgs/search.png';
                searchImg.alt = 'search';
                
                rightDiv.appendChild(searchImg);
                
                // Append left and right parts to the header
                header.appendChild(leftDiv);
                header.appendChild(rightDiv);
                
                // Create the send message section
                const sendMessageDiv = document.createElement('div');
                sendMessageDiv.className = 'send_message';

                const formSendMessageDiv = document.createElement('form');
                formSendMessageDiv.onsubmit = 'return false'
                
                const messageInput = document.createElement('input');
                messageInput.type = 'text';
                messageInput.placeholder = 'send message';
                messageInput.required = true
                
                // <input type="image" src="path/to/your/image.png" alt="Submit" />
                const sendImg = document.createElement('input');
                sendImg.type = 'image';
                sendImg.src = 'assets/imgs/send.png';
                sendImg.alt = 'Submit';
                
                formSendMessageDiv.appendChild(messageInput);
                formSendMessageDiv.appendChild(sendImg);
                sendMessageDiv.appendChild(formSendMessageDiv);
                
                // Append all sections to the body (or any container)
                chatBox.appendChild(header);
                chatBox.appendChild(sendMessageDiv);
                sendMessage()
                viewMessages()
            })
    });
}

// handle send message
function sendMessage() {
    let input = document.querySelector("main .container > .right .send_message input")
    let img = document.querySelector('main .container > .right .send_message input[type="image"]');
    let form = document.querySelector('main .container > .right .send_message form');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevents the form from submitting
    });

    img.addEventListener("click", function() {
        CHeckIfAnyChangesInChatsListener()
        allowed = true
        let receiver = sessionStorage.getItem("receiver")
        module.chatsContainer(sessionStorage.getItem("opened_chat"), input.value, receiver)
        input.value = ""
    })
}

// handle view messages
function viewMessages() {
    let sender = sessionStorage.getItem("sender")
    let receiver = sessionStorage.getItem("receiver")
    let rightDiv = document.querySelector("main .container > .right")
    let existChatDiv = document.querySelector("main .container > .right .chat")

    if (existChatDiv !== null) {
        existChatDiv.remove()
    }

    // Create the chat section
    const chatDiv = document.createElement('div');
    chatDiv.className = 'chat';

    let chatId = JSON.parse(sessionStorage.getItem("opened_chat"))

    let allChats = JSON.parse(sessionStorage.getItem("chats"))

    if(allChats[chatId] !== undefined){
        for (const key in allChats[chatId]) {
            // console.log(allChats[chatId][key])
    
                if (allChats[chatId][key].receiver == sender){
                    let dateObj = new Date(allChats[chatId][key].date);
                    // Format the date to remove the seconds
                    let options = { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
                    let formattedDate = dateObj.toLocaleString('en-US', options);

                    // Friend's message
                    const friendMessageDiv = document.createElement('div');
                    friendMessageDiv.className = 'friend_message';
                
                    var friendCont = document.createElement('div');
                    friendCont.className = 'cont';
                
                    var friendContent = document.createElement('h3');
                    friendContent.className = 'content';
                    friendContent.textContent = allChats[chatId][key].msg;
    
                    const friendDate = document.createElement('h4');
                    friendDate.className = 'date';
                    friendDate.textContent = formattedDate;
    
                    friendCont.appendChild(friendContent);
                    friendCont.appendChild(friendDate);
                    friendMessageDiv.appendChild(friendCont);
                    chatDiv.appendChild(friendMessageDiv);
                }
    
                if (sender == allChats[chatId][key].sender){
                    let dateObj = new Date(allChats[chatId][key].date);
                    // Format the date to remove the seconds
                    let options = { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
                    let formattedDate = dateObj.toLocaleString('en-US', options);

                    // My message
                    const myMessageDiv = document.createElement('div');
                    myMessageDiv.className = 'my_message';
                    
                    const myCont = document.createElement('div');
                    myCont.className = 'cont';
                    
                    const myContent = document.createElement('h3');
                    myContent.className = 'content';
                    myContent.textContent = allChats[chatId][key].msg;
                    
                    const myDate = document.createElement('h4');
                    myDate.className = 'date';
                    myDate.textContent = formattedDate;
                    
                    myCont.appendChild(myContent);
                    myCont.appendChild(myDate);
                    myMessageDiv.appendChild(myCont);
                    
                    // Append messages to chat
                    chatDiv.appendChild(myMessageDiv);
    
                }
    
                rightDiv.insertBefore(chatDiv, rightDiv.querySelector(".send_message"));
    
        }
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
}


