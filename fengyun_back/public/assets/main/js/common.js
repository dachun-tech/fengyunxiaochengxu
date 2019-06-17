function _local_to_utc(local) {
    let current_local_time = new Date(local);
    current_local_time.setHours(current_local_time.getHours() - 8);
    return new Date(current_local_time);
}
function china_time(time) {
    let input_time = _local_to_utc(time);
    let year = input_time.getFullYear();
    let month = input_time.getMonth() + 1;
    let day = input_time.getDate();
    let hours = input_time.getHours();
    let minutes = input_time.getMinutes();
    return year + "年" + month + "月" + day + "日 " + makeNDigit(hours) + ":" + makeNDigit(minutes)
}
function makeNDigit(num, len) {
    num = num.toString();
    if (!len) len = 2;
    let ret = '';
    for (let i = 0; i < len; i++) {
        ret += '0';
    }
    ret += num;
    ret = ret.substr(-len);
    return ret;
}
function autocomplete_func(inp, arr, isAllShowed) {
    if(isAllShowed==undefined) isAllShowed = false;
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!isAllShowed && !val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (isAllShowed || arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
function checkValidPhone(phone) {
    var compare = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    return compare.test(phone);
}
function checkValidNumber(num) {
    return Number.isInteger(num)
}
function checkValidTime(time) {

    let regex = /^\d{2,}:(?:[0-5]\d)$/;
    if (!regex.test(time)) return false;
    if (time.length > 5 || time.split(':')[0] > '23') return false;
    return true;
}
function checkValidDate(date) {
    let regex = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
    return regex.test(date);
}
// re-new pagination tags
let page_rows = 10;
function custom_pagination(cur_page, total_page) {
    if (cur_page === '首页') cur_page = 1;
    else if (cur_page === '尾页') cur_page = total_page;
    else cur_page = parseInt(cur_page);
    $("ul.pagination li").remove();
    var li_tags = "";
    if (cur_page === 1) li_tags += "<li class='page-item disabled'><a class='page-link'>首页</a></li>";
    else li_tags += "<li class='page-item'><a class='page-link' href='javascript:;'>首页</a></li>";
    var i_tag = cur_page > 3 ? cur_page - 2 : 1;
    if (i_tag !== 1) li_tags += "<li class='page-item disabled'><a class='page-link'>...</a></li>";
    for (; i_tag <= cur_page + 2 && i_tag <= total_page; i_tag++) {
        if (i_tag === cur_page) li_tags += "<li class='page-item active'><a class='page-link'>" + i_tag + "</a></li>";
        else li_tags += "<li class='page-item'><a class='page-link' href='javascript:;'>" + i_tag + "</a></li>";
        if (i_tag === (cur_page + 2) && i_tag < total_page) {
            li_tags += "<li class='page-item disabled'><a class='page-link'>...</a></li>";
        }
    }
    if (cur_page === total_page) li_tags += "<li class='page-item disabled'><a class='page-link'>尾页</a></li>";
    else li_tags += "<li class='page-item'><a class='page-link' href='javascript:;'>尾页</a></li>";
    $("ul.pagination").append(li_tags);
}
// pagination
$(document).on("click", 'ul>li[class="page-item"]', function() {
    let cur_page = $(this).text();
    reload_table(cur_page);
});
function getFilenameFromURL(str) {
    if (str == '' || str == null || str == undefined) return '';
    str = str.split('/');
    if(str[str.length - 1] == '') return str[str.length - 2].toLowerCase();
    return str[str.length - 1].toLowerCase();
}

function getFiletypeFromURL(str) {
    if (str == '' || str == null || str == undefined) return '';
    str = str.split('.');
    return str[str.length - 1].toLowerCase();
}

function removeExtFromFilename(str) {
    if (str == '' || str == null || str == undefined) return '';
    str = str.split('.');
    if (str.length == 1) return str[0].toLowerCase();
    return str[str.length - 2].toLowerCase();
}
function exportTable(table_name){
    $(".table tbody td").append('<span>&nbsp;</span>');
    $(".table").table2excel({
        exclude: ".noExl",
        name: "Excel Document Name",
        filename: table_name,
        fileext: ".xls",
        exclude_img: true,
        exclude_links: true,
        exclude_inputs: true
    });
    $(".table tbody td span").remove();
}
