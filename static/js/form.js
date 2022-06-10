// $(document).ready(function () {
//     // console.log($('#A').val())
//     // console.log($('#A').val())
//     $('#result').text("YOYO");
//     $('form').on('submit', function(event){
//
//         $.ajax({
//             data: {
//                 a: $('#A').val(),
//                 b: $('#B').val()
//             },
//             type: 'POST',
//             url: '/add_numbers'
//         })
//             .done(function(data){
//                 $('#result').text(data.result);
//             });
//         event.preventDefault();
//     });
// });

// var all = document.getElementsByTagName("*");
//
// for (var i=0, max=all.length; i < max; i++) {
//      console.log(all[i]);
// }
$(document).ready(function () {
    let xhttp = new XMLHttpRequest();
    let submitButton = document.getElementById('calculate');
    console.log(submitButton);
// submitB
    $('#calculate').click(function (event) {
        let a = document.getElementById('A').value;
        let b = document.getElementById('B').value;
        console.log('I am here');
        xhttp.open("POST", '/add_numbers', true)
        xhttp.setRequestHeader('Content-type', "application/json;charset=UTF-8")
        xhttp.send(JSON.stringify({"a": a, "b": b}));
        event.preventDefault();
    });

    xhttp.onreadystatechange = function(){
if (xhttp.readyState===4){
    if(this.status===200)
    {
        let result = JSON.parse(this.responseText)
        document.getElementById('result').innerHTML = result['result'];
    }
}
    };
});




