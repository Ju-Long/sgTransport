const { retrieveBusStops, retrieveBuses, retrieveBus, retrieveBusStopTiming, retrieveBusTiming } = require('./scripts/retrieving');
const { getBusStops, getBuses, getBusRoutes } = require('./scripts/requests')
const fs = require('fs')

const writeToFile = async () => {
    const buses = await getBuses()
    const bus_stops = await getBusStops()
    const bus_routes = await getBusRoutes()

    for (let i in bus_routes) {
        let bus_route = bus_routes[i];
        let index = bus_stops.findIndex((bus_stop) => {return bus_stop.BusStopCode === bus_route.BusStopCode})
        if (index < 0) { continue; }
        
        let bus_index = buses.findIndex((bus) => {return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)})

        if (bus_stops[index].Buses == undefined || 
            bus_stops[index].Buses == null) {
                bus_stops[index].Buses = [buses[bus_index]]
        } else {
            bus_stops[index].Buses.push(buses[bus_index])
        }
    }

    fs.writeFileSync('./test.json', JSON.stringify(bus_stops))

    readFromFile()
}

writeToFile()

const readFromFile = () => {
    const lat = 1
    const long = 103
    const sorted_bus_stops = []
    console.time("readFromFile-GettingData")
    const bus_stops = JSON.parse(fs.readFileSync("./test.json"));
    console.timeEnd("readFromFile-GettingData")

    console.time("readFromFile-CalculatingData")
    for (let i in bus_stops) {
        let bus_stop = bus_stops[i];

        let radlat1 = Math.PI * Number(lat)/180
        let radlat2 = Math.PI * Number(bus_stop.Latitude)/180
        let theta = Number(long)-Number(bus_stop.Longitude)
        let radtheta = Math.PI * theta/180
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515
        dist = dist * 1.609344 

        bus_stop.distance = dist
        sorted_bus_stops.push(bus_stop)
    }
    console.timeEnd("readFromFile-CalculatingData")

    console.time("readFromFile-SortingData")
    sorted_bus_stops.sort(function (a, b) {
        return a.distance - b.distance
    })
    console.timeEnd("readFromFile-SortingData")
}

// const TestingNearestLocationExecutionSpeed = async () => {
//     const lat = 1
//     const long = 103
//     const sorted_bus_stops = []
//     console.time("TestingNearestLocationExecutionSpeed-GettingData")
//     const bus_stops = await retrieveBusStops();
//     console.timeEnd("TestingNearestLocationExecutionSpeed-GettingData")

//     console.time("TestingNearestLocationExecutionSpeed-CalculatingData")
//     for (let i in bus_stops) {
//         let bus_stop = bus_stops[i];

//         let radlat1 = Math.PI * Number(lat)/180
//         let radlat2 = Math.PI * Number(bus_stop.Latitude)/180
//         let theta = Number(long)-Number(bus_stop.Longitude)
//         let radtheta = Math.PI * theta/180
//         let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
//         dist = Math.acos(dist)
//         dist = dist * 180/Math.PI
//         dist = dist * 60 * 1.1515
//         dist = dist * 1.609344 

//         bus_stop.distance = dist
//         sorted_bus_stops.push(bus_stop)
//     }
//     console.timeEnd("TestingNearestLocationExecutionSpeed-CalculatingData")

//     console.time("TestingNearestLocationExecutionSpeed-SortingData")
//     sorted_bus_stops.sort(function (a, b) {
//         return a.distance - b.distance
//     })
//     console.timeEnd("TestingNearestLocationExecutionSpeed-SortingData")
// }

// TestingNearestLocationExecutionSpeed()

// const TestingNearestLocationExecutionSpeedWithQuickSort = async () => {
//     console.time("TestingNearestLocationExecutionSpeedWithQuickSort")
//     console.log("Testing Nearest Location Execution Speed With Quick Sort")
//     const lat = 1
//     const long = 103
//     const sorted_bus_stops = []
//     const bus_stops = await retrieveBusStops();

//     for (let i in bus_stops) {
//         let bus_stop = bus_stops[i];

//         let radlat1 = Math.PI * Number(lat)/180
//         let radlat2 = Math.PI * Number(bus_stop.Latitude)/180
//         let theta = Number(long)-Number(bus_stop.Longitude)
//         let radtheta = Math.PI * theta/180
//         let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
//         dist = Math.acos(dist)
//         dist = dist * 180/Math.PI
//         dist = dist * 60 * 1.1515
//         dist = dist * 1.609344 

//         bus_stop.distance = dist
//         sorted_bus_stops.push(bus_stop)
//     }
    
//     function swap(items, leftIndex, rightIndex){
//         var temp = items[leftIndex];
//         items[leftIndex] = items[rightIndex];
//         items[rightIndex] = temp;
//     }

//     function partition(items, left, right) {
//         let pivot   = items[Math.floor((right + left) / 2)] //middle element
//         let i       = left //left pointer
//         let j       = right; //right pointer
//         while (i <= j) {
//             while (items[i].distance < pivot.distance) {
//                 i++;
//             }
//             while (items[j].distance > pivot.distance) {
//                 j--;
//             }
//             if (i <= j) {
//                 swap(items, i, j); //sawpping two elements
//                 i++;
//                 j--;
//             }
//         }
//         return i;
//     }
    
//     function quickSort(items, left, right) {
//         var index;
//         if (items.length > 1) {
//             index = partition(items, left, right); //index returned from partition
//             if (left < index - 1) { //more elements on the left side of the pivot
//                 quickSort(items, left, index - 1);
//             }
//             if (index < right) { //more elements on the right side of the pivot
//                 quickSort(items, index, right);
//             }
//         }
//         return items;
//     }

//     quickSort(sorted_bus_stops, 0, sorted_bus_stops.length - 1)

//     console.log("Finish Testing Nearest Location Execution Speed With Quick Sort")
//     console.timeEnd("TestingNearestLocationExecutionSpeedWithQuickSort")
// }

// TestingNearestLocationExecutionSpeedWithQuickSort()