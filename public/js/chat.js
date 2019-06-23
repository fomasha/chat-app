const socket = io();

const sendButton = document.querySelector('#send')
const input = document.querySelector('#message')
const locationButton = document.querySelector('#send-location')
const messagesContainer = document.querySelector('#messages')
const sidebar = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    const newMessage = messagesContainer.lastElementChild
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageHeight = newMessage.offsetHeight + parseInt(newMessageStyles.marginBottom)

    const visibleHieght = messagesContainer.offsetHeight

    const containerHigth = messagesContainer.scrollHeight

    const scrollOffset = messagesContainer.scrollTop + visibleHieght

    if (containerHigth - newMessageHeight <= scrollOffset) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
}

sendButton.addEventListener('click', (event) => {
    event.preventDefault()

    sendButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', input.value, (error) => {
        input.value = ''
        input.focus()
        sendButton.removeAttribute('disabled')

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

socket.on('message', ({ username, text: message, createdAt: timestamp }) => {
    const createdAt = moment(timestamp).format('h:mm a')
    const html = Mustache.render(messageTemplate, { message, createdAt, username })
    messagesContainer.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported in your browser!')
    }

    locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
        socket.emit('sendLocation', { latitude, longitude }, () => {
            locationButton.removeAttribute('disabled')

            console.log('Location shared!')
        })
    })
})

socket.on('locationMessage', ({ username, url, createdAt: timestamp }) => {
    const createdAt = moment(timestamp).format('h:mm a')
    const html = Mustache.render(locationMessageTemplate, { url, createdAt, username })
    messagesContainer.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users })
    sidebar.innerHTML = html
})