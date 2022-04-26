const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild
    //Height the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on("message", (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a") 
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (location)=>{
    console.log(location)
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        location: location.location,
        createdAt: moment(location.createdAt).format("h:mm a") 
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e)=>{
    e.preventDefault()
    //disable send
    $messageFormButton.setAttribute("disabled", "disabled")

    const msg = e.target.elements.message.value
    socket.emit("sendMessage", msg, (error)=>{
        //enable send
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()
        if(error){
            alert(error)
            return console.log(error)
        }
        console.log("The message was delivered successfully")
    })
})

$locationButton.addEventListener("click", ()=>{
    if(!navigator.geolocation){
        return alert("Geolocation unavailable in your browser")
    }
    $locationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position)=>{
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit("sendLocation", location, (ack)=>{
            $locationButton.removeAttribute("disabled")
            console.log(ack)
        })
    })
})

socket.emit("join", {username, room}, (error)=>{
    if (error){
        alert(error)
        location.href = "/"
    }
})

