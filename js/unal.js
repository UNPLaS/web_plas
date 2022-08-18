let carousel = document.querySelector('.carousel-plas');

let carouselInner = document.querySelector('.carousel-inner-plas');

let prev = document.querySelector('.carousel-controls-plas .prev');

let next = document.querySelector('.carousel-controls-plas .next');

let slides = document.querySelectorAll('.carousel-inner-plas .carousel-item-plas');

let totalSlides = slides.length;

let step = 100 / totalSlides;

let activeSlide = 0;

let activeIndicator = 0;

let direction = -1;

let jump = 1;

let interval = 5000;

let time;

//Init carousel
carouselInner.style.minWidth = (totalSlides * 100) + '%';
loadIndicators();

loop(true);


//Carousel events

next.addEventListener('click', () => {
    slideToNext();
});

prev.addEventListener('click', () => {
    slideToPrev();
});

carouselInner.addEventListener('transitionend', () => {
    if (direction === -1) {
        if (jump > 1) {
            for (let i = 0; i < jump; i++) {
                activeSlide++;
                carouselInner.append(carouselInner.firstElementChild);
            }
        } else {
            activeSlide++;
            carouselInner.append(carouselInner.firstElementChild);
        }
    } else if (direction === 1) {
        if (jump > 1) {
            for (let i = 0; i < jump; i++) {
                activeSlide--;
                carouselInner.prepend(carouselInner.lastElementChild);
            }
        } else {
            activeSlide--;
            carouselInner.prepend(carouselInner.lastElementChild);
        }
    }
    ;

    carouselInner.style.transition = 'none';
    carouselInner.style.transform = 'translateX(0%)';
    setTimeout(() => {
        jump = 1;
        carouselInner.style.transition = 'all ease .5s';
    });
    updateIndicators();
});

document.querySelectorAll('.carousel-indicators-plas span').forEach(item => {
    item.addEventListener('click', (e) => {
        let slideTo = parseInt(e.target.dataset.slideTo);

        let indicators = document.querySelectorAll('.carousel-indicators-plas span');

        indicators.forEach((item, index) => {
            if (item.classList.contains('active')) {
                activeIndicator = index
            }
        })

        if (slideTo - activeIndicator > 1) {
            jump = slideTo - activeIndicator;
            step = jump * step;
            slideToNext();
        } else if (slideTo - activeIndicator === 1) {
            slideToNext();
        } else if (slideTo - activeIndicator < 0) {

            if (Math.abs(slideTo - activeIndicator) > 1) {
                jump = Math.abs(slideTo - activeIndicator);
                step = jump * step;
                slideToPrev();
            }
            slideToPrev();
        }
        step = 100 / totalSlides;
    })
});

carousel.addEventListener('mouseover', () => {
    loop(false);
})

carousel.addEventListener('mouseout', () => {
    loop(true);
})

//Carousel functions

function loadIndicators() {
    slides.forEach((slide, index) => {
        if (index === 0) {
            document.querySelector('.carousel-indicators-plas').innerHTML +=
                `<span data-slide-to="${index}" class="active"></span>`;
        } else {
            document.querySelector('.carousel-indicators-plas').innerHTML +=
                `<span data-slide-to="${index}"></span>`;
        }
    });
};

function updateIndicators() {
    if (activeSlide > (totalSlides - 1)) {
        activeSlide = 0;
    } else if (activeSlide < 0) {
        activeSlide = (totalSlides - 1);
    }
    document.querySelector('.carousel-indicators-plas span.active').classList.remove('active');
    document.querySelectorAll('.carousel-indicators-plas span')[activeSlide].classList.add('active');
};

function slideToNext() {
    if (direction === 1) {
        direction = -1;
        carouselInner.prepend(carouselInner.lastElementChild);
    }
    ;

    carousel.style.justifyContent = 'flex-start';
    carouselInner.style.transform = `translateX(-${step}%)`;
};

function slideToPrev() {
    if (direction === -1) {
        direction = 1;
        carouselInner.append(carouselInner.firstElementChild);
    }
    ;
    carousel.style.justifyContent = 'flex-end'
    carouselInner.style.transform = `translateX(${step}%)`;
};

function loop(status) {
    if (status === true) {
        time = setInterval(() => {
            slideToNext();
        }, interval);
    } else {
        clearInterval(time);
    }
}


var nav = false;

function openNav() {
    document
        .getElementById("mySidebar")
        .style
        .right = "0px";
    document
        .getElementById("main")
        .style
        .right = "200px";
    document
        .getElementById("openbtnId")
        .style
        .backgroundPosition = "35px 0";
    nav = true;
}

/* Set the width of the sidebar to 0
and the left margin of the page content to 0 */

function closeNav() {
    document
        .getElementById("mySidebar")
        .style
        .right = "-200px";
    document
        .getElementById("main")
        .style
        .right = "0px";
    document
        .getElementById("openbtnId")
        .style
        .backgroundPosition = "0 0";
    nav = false;
}

function toggleNav() {
    nav ? closeNav() : openNav();
}

mybutton = document.getElementById("myBtn");
window.onscroll = function () {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

document.getElementById("btnProyectos").onclick = function () {
    var url = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
    if (url === "lenguajes.html") {
        location.href = "../proyectos/proyectos.html";
    } else if (url === "educacion.html") {
        location.href = "../proyectos/proyectos.html#listado2";
    } else if (url === "embebidos.html") {
        location.href = "../proyectos/proyectos.html#listado3";
    } else if (url === "transporte.html") {
        location.href = "../proyectos/proyectos.html#listado4";
    } else if (url === "agricultura.html") {
        location.href = "../proyectos/proyectos.html#listado5";
    }
};
document.getElementById("btnPublicaciones").onclick = function () {
    var url = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
    if (url === "lenguajes.html") {
        location.href = "../publicaciones.html";
    } else if (url === "educacion.html") {
        location.href = "../publicaciones.html#publicacion2";
    } else if (url === "embebidos.html") {
        location.href = "../publicaciones.html#publicacion3";
    } else if (url === "transporte.html") {
        location.href = "../publicaciones.html#publicacion4";
    } else if (url === "agricultura.html") {
        location.href = "../publicaciones.html#publicacion5";
    }
};

