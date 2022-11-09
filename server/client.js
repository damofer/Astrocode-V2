const socket = new WebSocket("ws://localhost:3001");
socket.addEventListener("message", (event) => {
  if (event.data === "RELOAD") {
    console.log("something")
    window.location.reload();
  }
});