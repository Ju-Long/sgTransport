const { retrieveBusStops, retrieveBuses, retrieveBus, retrieveBusStopTiming, retrieveBusTiming } = require('./scripts/retrieving');

const TestingNearestLocationExecutionSpeed = async () => {
    const lat = 1
    const long = 103
    const sorted_bus_stops = []
    console.time("GettingData")
    const bus_stops = await retrieveBusStops();
    console.timeEnd("GettingData")

    console.time("CalculatingData")
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
    console.timeEnd("CalculatingData")

    console.time("SortingData")
    sorted_bus_stops.sort(function (a, b) {
        return a.distance - b.distance
    })
    console.timeEnd("SortingData")
}

TestingNearestLocationExecutionSpeed()

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