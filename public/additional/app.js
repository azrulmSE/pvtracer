window.onload = function() {
    /* first query data */
    var data_receive = [];
    var latest_data = [];
    var data_x = [];
    var data_y = [];
    var pv_curve = [];

    /* end first query data */
    var host = window.document.location.host.replace(/:.*/, '');
    /*var ws = new WebSocket('ws://' + host + ':8080');
    ws.onmessage = function(event) {
        //console.log('onmessage: '+JSON.parse(event.data));
        console.log('onmessage: ' + event.data);
    };*/
    /*
        var socket = new WebSocket('ws://' + host + ':8080');
        socket.onmessage = function(event) {
            var message = event.data;
            console.log('message: ' + JSON.stringify(message));
        };
        socket.onerror = function(error) {
            console.log('WebSocket Error: ' + error);
        };*/
    //var socket = new WebSocket('ws://' + host + ':3232');
    var socket = new WebSocket('wss://echo.websocket.org/');

    socket.onerror = function(error) {
        console.log('WebSocket Error: ' + error);
    };

    socket.onopen = function(event) {
        console.log('Connected to: ws://' + host + ':8080');
    };

    socket.onmessage = function(event) {
        console.log('message: ' + JSON.stringify(event.data));


    };

    socket.onclose = function(event) {
        console.log('Closed to: ws://' + host + ':8080');
    };

    /* mqtt */
    // Create a client instance
    var client = new Paho.MQTT.Client("iot.eclipse.org", Number(80), "/ws", "testing_pravo");

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    // connect the client
    client.connect({
        onSuccess: onConnect
    });


    // called when the client connects
    function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log("onConnect");
        client.subscribe("pvtracer/data_incoming/");
        /*message = new Paho.MQTT.Message("Hello");
        message.destinationName = "World";
        client.send(message);*/
    }

    // called when the client loses its connection
    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    }

    // called when a message arrives
    function onMessageArrived(message) {
        console.log("onMessageArrived:" + message.payloadString);
        var incoming_data = JSON.parse(message.payloadString);
        data_y = incoming_data.data_y;
        data_x = incoming_data.data_x;
        var indicator = 0;
        data_receive = [];
        pv_curve = [];
        var max = data_x.reduce(function(x, y) {
            return (x > y) ? x : y;
        });
        var volt;
        var y_max = 0;
        for (var i = data_y.length - 1; i > -1; i--) {
            /*data_receive.push([
                x: data_x[i],
                y: data_y[i]
            ]);*/
            //data_receive[i].push(data_x[i], data_y[i]);
            var indic, color;

            if (max == data_x[i]) {
                color = 'red';
                volt = data_y[i];

            } else color = 'blue';
            indic = data_x[i];
            //data_receive = data_receive.concat([[indicator, indic]]);
            data_receive.push({
                x: indicator,
                y: indic,
                marker: {
                    radius: 4,
                    lineColor: color,
                    lineWidth: 1
                }
            })
            var y_data = (Number(data_x[i]) * Number(data_y[i]));
            pv_curve = pv_curve.concat([
                [indicator, Number(y_data.toFixed(2))]
            ]);
            indicator = indicator + 2;
        }

        data_receive = [];
        indicator = 0;
        for (var i = data_y.length - 1; i > -1; i--) {
            var indic, color;

            if (y_max == indicator) {
                color = 'red';
                max = data_y[i];
            } else color = 'blue';
            indic = data_x[i];
            //data_receive = data_receive.concat([[indicator, indic]]);
            data_receive.push({
                x: indicator,
                y: indic,
                marker: {
                    radius: 4,
                    lineColor: color,
                    lineWidth: 1
                }
            });
            var y_data = (Number(data_x[i]) * Number(data_y[i]));
            if (Number(y_data.toFixed(2)) > Number(max2)) {
                //console.log('i'+i);
                max2 = Number(y_data.toFixed(2));
            }
            //console.log(Number(y_data.toFixed(2)));
            /*pv_curve3 = pv_curve3.concat([
                [indicator, Number(y_data.toFixed(2))]
            ]);*/
            indicator = indicator + 2;
        }

        first_chart.yAxis[0].removePlotLine('plotband-1');

        first_chart.series[0].update({
            name: "Current, I",
            data: data_receive
        }, true);
        first_chart.yAxis[0].addPlotBand({
            from: max,
            to: 0,
            color: 'rgba(68, 170, 213, .2)',
            id: 'plotband-1'
        }, true);
        //first_chart.series[0].setData(data_receive, true);

        second_chart.series[0].update({
            name: "Power, P",
            data: pv_curve
        }, true);

        var current_time = new Date().getTime();
        //third_chart.series[0].addPoint([max, current_time], true, true);
        third_chart.series[0].addPoint([current_time, max], true, true);

        var newDate = new Date();
        var datetime = "Last Update: " + newDate.today() + " @ " + newDate.timeNow();
        console.log('datetime: ' + datetime);
        var power = max * volt;
        $("#chartIV").html('Chart I-V Curve [' + datetime + '] I <span>max</span>= ' + max + ' A  V <span>max</span>= ' + volt + ' V');
        $("#chartPV").html('Chart P-V Curve [' + datetime + '] P <span>max</span>= ' + power + ' A  V <span>max</span>= ' + volt + ' V');
        console.log(' DATA 1: ' + JSON.stringify(data_receive));
        console.log(' DATA 2: ' + JSON.stringify(pv_curve));
    }
    /* end mqtt */
    /* first chart */
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    var first_chart = Highcharts.chart('container', {
        chart: {
            type: 'spline'
        },
        credits: {
            enabled: false
        },
        title: {
            text: 'I-V Curve'
        },

        yAxis: {
            title: {
                text: 'Current, I'
            }
        },
        xAxis: {
            title: {
                text: 'Voltage, V'
            }
        },
        /*legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },*/
        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        tooltip: {
            formatter: function() {
                return '<b>V : </b>' +
                    Highcharts.numberFormat(this.x, 0) + '<br> <b>I : </b>' +
                    Highcharts.numberFormat(this.y, 2);
            }
        },

        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                },
                dataLabels: {
                    enabled: true
                }
            }
        },
        series: [{
            data: data_receive
        }]
    });
    /* end first chart */
    /* second chart */
    var second_chart = Highcharts.chart('container2', {
        chart: {
            type: 'spline'
        },
        credits: {
            enabled: false
        },
        title: {
            text: 'P-V Curve'
        },

        yAxis: {
            title: {
                text: 'Power, P'
            }
        },
        xAxis: {
            title: {
                text: 'Voltage, V'
            }
        },
        /*legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },*/
        exporting: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        tooltip: {
            formatter: function() {
                return '<b>V : </b>' +
                    Highcharts.numberFormat(this.x, 0) + '<br> <b>P : </b>' +
                    Highcharts.numberFormat(this.y, 2);
            }
        },
        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                },
                dataLabels: {
                    enabled: true
                }
            }
        },
        series: [{
            data: pv_curve
        }]
    });
    /* end second chart */

    /* end third chart */
    // Create the chart

    var third_chart = Highcharts.stockChart('container3', {
        /*chart: {
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var series = this.series[0];
                    setInterval(function() {
                        var x = (new Date()).getTime(), // current time
                            y = Math.round(Math.random() * 100);
                        console.log('x: ' + x + ' y: ' + y);
                        $("#chartMax").text('Chart Power Maximun [ Max:' + y + ' ]');
                        series.addPoint([x, y], true, true);
                    }, 1000);
                }
            }
        },*/

        rangeSelector: {
            buttons: [{
                count: 1,
                type: 'minute',
                text: '1M'
            }, {
                count: 5,
                type: 'minute',
                text: '5M'
            }, {
                type: 'all',
                text: 'All'
            }],
            inputEnabled: false,
            selected: 0
        },

        title: {
            text: 'Chart Power Maximun Historical'
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        },

        series: [{
            name: 'Random data',
            data: (function() {
                // generate an array of random data
                var data = [],
                    time = (new Date()).getTime(),
                    i;

                for (i = -999; i <= 0; i += 1) {
                    data.push([
                        time + i * 1000,
                        Math.round(Math.random() * 100)
                    ]);
                }
                return data;
            }())
        }]
    });


    /* end third chart */
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var receive_data = JSON.parse(this.responseText);
            data_y = JSON.parse(receive_data[0].data_y);
            data_x = JSON.parse(receive_data[0].data_x);
            var indicator = 0;
            var max = data_x.reduce(function(x, y) {
                return (x > y) ? x : y;
            });
            var max2 = 0;
            var testjekot = [];
            for (var i = data_y.length - 1; i > -1; i--) {
                /*data_receive.push([
                    x: data_x[i],
                    y: data_y[i]
                ]);*/
                //data_receive[i].push(data_x[i], data_y[i]);
                var indic, color;

                if (max == data_x[i]) color = 'red';
                else color = 'blue';
                indic = data_x[i];
                //data_receive = data_receive.concat([[indicator, indic]]);
                data_receive.push({
                    x: indicator,
                    y: indic,
                    marker: {
                        radius: 4,
                        lineColor: color,
                        lineWidth: 1
                    }
                });
                var y_data = (Number(data_x[i]) * Number(data_y[i]));
                if (Number(y_data.toFixed(2)) > Number(max2)) {
                    //console.log('i'+i);
                    max2 = Number(y_data.toFixed(2));
                }
                //console.log(Number(y_data.toFixed(2)));
                pv_curve = pv_curve.concat([
                    [indicator, Number(y_data.toFixed(2))]
                ]);
                indicator = indicator + 2;
            }


            var pv_curve2 = [];
            var y_max = 0;
            for (var t = 0; t < pv_curve.length; t++) {
                console.log(pv_curve[t][1]);
                if (max2 == pv_curve[t][1]) {
                    console.log(pv_curve[t][1]);
                    var color = 'red';
                    y_max = pv_curve[t][0];
                    pv_curve2.push({
                        x: pv_curve[t][0],
                        y: pv_curve[t][1],
                        marker: {
                            radius: 4,
                            lineColor: color,
                            lineWidth: 1
                        }
                    });
                } else {
                    console.log(pv_curve[t][1]);
                    var color = 'blue';
                    pv_curve2.push({
                        x: pv_curve[t][0],
                        y: pv_curve[t][1],
                        marker: {
                            radius: 4,
                            lineColor: color,
                            lineWidth: 1
                        }
                    });
                }

            }
            data_receive = [];
            indicator = 0;
            for (var i = data_y.length - 1; i > -1; i--) {
                var indic, color;

                if (y_max == indicator) {
                    color = 'red';
                    max = data_y[i];
                } else color = 'blue';
                indic = data_x[i];
                //data_receive = data_receive.concat([[indicator, indic]]);
                data_receive.push({
                    x: indicator,
                    y: indic,
                    marker: {
                        radius: 4,
                        lineColor: color,
                        lineWidth: 1
                    }
                });
                var y_data = (Number(data_x[i]) * Number(data_y[i]));
                if (Number(y_data.toFixed(2)) > Number(max2)) {
                    //console.log('i'+i);
                    max2 = Number(y_data.toFixed(2));
                }
                //console.log(Number(y_data.toFixed(2)));
                /*pv_curve3 = pv_curve3.concat([
                    [indicator, Number(y_data.toFixed(2))]
                ]);*/
                indicator = indicator + 2;
            }
            console.log('pv_curve: ' + JSON.stringify(pv_curve));
            console.log('max2: ' + max2 + ' ' + pv_curve.length + 'y_max: ' + y_max);
            console.log('max: ' + max);

            //console.log('receive_data: '+this.responseText);
            /*var tests = [data_receive, pv_curve];
            first_chart.series[0].name = "test";*/
            first_chart.series[0].update({
                name: "Current, I",
                data: data_receive
            }, true);
            first_chart.yAxis[0].addPlotLine({
                value: max2,
                type: 'scatter',
                color: '#ff0000',
                width: 1,
                zIndex: 4,
                label: {
                    text: 'Max: ' + max
                },
                id: 'plotband-1'
            }, true);
            //first_chart.series[0].setData(data_receive, true);

            second_chart.series[0].update({
                name: "Power, P",
                data: pv_curve2
            }, true);
            second_chart.yAxis[0].addPlotLine({
                value: max2,
                type: 'scatter',
                color: '#ff0000',
                width: 1,
                zIndex: 4,
                label: {
                    text: 'Max: ' + max2
                },
                id: 'plotband-1'
            }, true);

            var current_time = new Date().getTime();
            //third_chart.series[0].addPoint([max, current_time], true, true);
            //third_chart.series[0].addPoint({ x: max,y: current_time},false,shift);

            var newDate = new Date();
            var datetime = "Last Update: " + newDate.today() + " @ " + newDate.timeNow();
            console.log('datetime: ' + datetime);
            var power = max * y_max;
            $("#chartIV").html('Chart I-V Curve [' + datetime + '] I <span>max</span>= ' + max + ' A  V <span>max</span>= ' + y_max + ' V');
            $("#chartPV").html('Chart P-V Curve [' + datetime + '] P <span>max</span>= ' + power + ' A  V <span>max</span>= ' + y_max + ' V');

            //second_chart.series[0].setData(pv_curve, true);
            console.log(' DATA 1: ' + JSON.stringify(data_receive));
            console.log(' DATA 2: ' + JSON.stringify(pv_curve));

        }
    };
    xhttp.open("POST", "http://localhost:3000/api/queryData", true);
    xhttp.send();


    Date.prototype.today = function() {
        return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
    }

    // For the time now
    Date.prototype.timeNow = function() {
        return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
    }
};