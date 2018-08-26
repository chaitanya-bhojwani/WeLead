function fetchTrans () {
    $.get( ".blockchain", function( data ) {
        alert( "Data Loaded: " + data );
    });
}

function getBlocks () {
    $.get( "/blockchain", function( data ) {
        // alert( "Data Loaded: " + data );
        console.log(data);
    });
}