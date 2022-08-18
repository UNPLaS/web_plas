// function showProfesores() {
//     let profesores = document.getElementById("profesores")
//     let doctorado = document.getElementById("doctorado")
//     let maestria = document.getElementById("maestria")
//     doctorado.style.display = "none"
//     maestria.style.display = "none"
//     if (profesores.style.display === "none")
//         profesores.style.display = "block"
//
// }
//
// function showDoctorado() {
//     let profesores = document.getElementById("profesores")
//     let doctorado = document.getElementById("doctorado")
//     let maestria = document.getElementById("maestria")
//     profesores.style.display = "none"
//     maestria.style.display = "none"
//     if (doctorado.style.display === "none")
//         doctorado.style.display = "block"
//     // profesores.style.display = "initial"
// }

const boton = document.getElementById("btn-profesores")
boton.focus()
var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
});
const popover = new bootstrap.Popover('.popover-dismiss', {
    trigger: 'focus'
})

