function setBoxColor(color){
    document.getElementById("box").style.background = color;
}

function printData(vognID) {
    $(function () {
        var colour;

        $.getJSON('myDataBase2.json', function (data) {
            var entry = 'data' + vognID; // Elementerne i databasen hedder data0, data1...

            // På baggrund af antallet af optagede pladser bestemmes signalets farve
            if (data[entry].antal_optagede_pladser >= 7) {
                colour = "Rød"
                setBoxColor('red'); // sæt boksens farve
            } else if (data[entry].antal_optagede_pladser > 4 && data[entry].antal_optagede_pladser < 7) {
                colour = "Gul"
                setBoxColor('yellow');
            } else {
                colour = "Grøn"
                setBoxColor('green');
            }

            // Information om vognen tilføjes til tabellen
            var tblRow = "<tr>" + "<td>" + vognID + "</td>" + "<td>" + data[entry].antal_optagede_pladser + "</td>" +
                "<td>" + data[entry].lognummer + "</td>" + "<td>" + colour + "</td>" + "</tr>";
            $(tblRow).appendTo("#tabVognData tbody");
        });
    });
}

function emptyTable() {
    $(function () {
        $('#tableBody').empty();
    });
}

function readForm() {
    var vognID = document.getElementById("inputVognID").value;
    emptyTable();
    printData(vognID);
}
