
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

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
});

mybutton = document.getElementById("myBtn");
window.onscroll = function () { scrollFunction() };
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
            