const { getBusStopArrival, getBusArrival, getBusRoutes, getBuses, getBusStops } = require('./scripts/requests');
const { cache, storingBusStopTiming, storingBusTiming, storingNearestLocation } = require('./scripts/caching');
const { retrieveBusStops, retrieveBuses, retrieveBus, retrieveBusStopTiming, retrieveBusTiming, retrieveNearestLocation, retrieveBusStop } = require('./scripts/retrieving');
const adult_fare = require('../assets/adult_fare.json');

module.exports = async (fastify, opts) => {
    fastify.get('/bus/cache', async (request, reply) => {
        return await cache()
    });

    // MARK: GET BUS DISTANCE AT ALL BUS STOP
    fastify.get('/bus/distance/:StartBusStopCode/:EndBusStopCode', async (request, reply) => {
        const StartBusStopCode = request.params.StartBusStopCode;
        const EndBusStopCode = request.params.EndBusStopCode;
        var fare = request.query.fare;
        if (!StartBusStopCode || !EndBusStopCode) {
            return {response: 'error', error: 'invalid Bus Stop Codes input', parameters: {StartBusStopCode: StartBusStopCode, EndBusStopCode: EndBusStopCode}};
        }

        if (!fare) {
            fare = "Adult"
        }

        let buses_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
        let buses_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);

        if (buses_in_start_bus_stop === []) {
            await cache();
            buses_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
        }
        if (buses_in_start_bus_stop === []) {
            return {response: 'error', error: 'no Start Bus Stop Code can be found', parameters: {StartBusStopCode: StartBusStopCode}}
        }

        if (buses_in_end_bus_stop === []) {
            await cache();
            buses_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);
        }
        if (buses_in_end_bus_stop === []) {
            return {response: 'error', error: 'no End Bus Stop Code can be found', parameters: {EndBusStopCode: EndBusStopCode}}
        }

        var buses_available = [];
        for (let i in buses_in_start_bus_stop.Buses) {
            let start_bus = buses_in_start_bus_stop.Buses[i];
            for (let n in buses_in_end_bus_stop.Buses) {
                let end_bus = buses_in_end_bus_stop.Buses[n];
                if (start_bus.ServiceNo === end_bus.ServiceNo && start_bus.Direction === end_bus.Direction) {
                    buses_available.push(start_bus.ServiceNo);
                }
            }
        }

        if (buses_available.length < 1) {
            return {response: 'error', error: 'No direct route found'};
        }

        var response = [];
        for (let i in buses_available) {
            let bus_available = buses_available[i];
            let bus = await retrieveBus(bus_available);
            let start_bus_route_index = bus.Route.findIndex((bus_stop) => { return bus_stop.BusStopCode === StartBusStopCode });
            console.log(start_bus_route_index)
            if (start_bus_route_index < 0) {
                response = { response: 'error', error: 'Start Bus Stop Code Not found on route', parameters: {BusStopCode: StartBusStopCode, bus: bus}};
                break;
            }
            let end_bus_route_index = bus.Route.findIndex((bus_stop) => { return bus_stop.BusStopCode === EndBusStopCode });
            if (end_bus_route_index < 0) {
                response = { response: 'error', error: 'End Bus Stop Code Not found on route', parameters: {ServiceNo: bus.ServiceNo, BusStopCode: StartBusStopCode}};
                break;
            }

            if (start_bus_route_index >= end_bus_route_index) {
                response = { response: 'error', error: 'the Start Bus Stop Code is later or the same the End Bus Stop Code'};
                break;
            }

            let start_bus_stop = bus.Route[start_bus_route_index];
            let end_bus_stop = bus.Route[end_bus_route_index];
            let dist_diff = end_bus_stop.Distance - start_bus_stop.Distance
            response.push({
                distance_difference: dist_diff,
                routes: bus.Route.splice(start_bus_route_index, end_bus_route_index)
            });
        }
        return response;
    })

    // MARK: GET BUS STOP BUS TIMING TIMING
    fastify.get('/bus/timing/BusStop/:BusStopCode', async (request, reply) => {
        const BusStopCode = request.params.BusStopCode
        if (!BusStopCode) {
            return {response: 'error', error: 'invalid Bus Stop Code input', parameters: {BusStopCode: BusStopCode}}
        }

        let bus_stop_timing = await retrieveBusStopTiming(BusStopCode);
        if (bus_stop_timing) {
            return bus_stop_timing
        }

        let timings = await getBusStopArrival(BusStopCode);
        let bus_stop = {
            BusStopCode: BusStopCode,
            timings: timings
        }

        await storingBusStopTiming(bus_stop)
        return bus_stop;
    })

    // MARK: SEARCH FOR BUS
    fastify.get('/bus/search/Bus/:ServiceNo', async (request, reply) => {
        const ServiceNo = request.params.ServiceNo
        if (!ServiceNo) {
            return {response: 'error', error: 'invalid Service No input', parameters: {ServiceNo: ServiceNo}}
        }

        let buses = await retrieveBuses();
        if (buses.length < 1) {
            await cache();
            bus = await retrieveBuses();
        }
        if (buses.length < 1) {
            return {response: 'error', error: 'Service Number Could not be found', parameters: {ServiceNo: ServiceNo}}
        }
        return buses.filter((bus) => { return bus.ServiceNo.includes(ServiceNo) });
    })

    // MARK: SEARCH FOR BUS STOP
    fastify.get('/bus/search/BusStop/:BusStopCode', async (request, reply) => {
        const BusStopCode = request.params.BusStopCode
        if (!BusStopCode) {
            return {response: 'error', error: 'invalid Bus Stop Code input', parameters: {BusStopCode: BusStopCode}}
        }

        let bus_stops = await retrieveBusStops();
        if (bus_stops.length < 1) {
            await cache();
            bus_stops = await retrieveBusStops();
        }
        if (bus_stops.length < 1) {
            return {response: 'error', error: 'Bus Stop Code Could not be found', parameters: {BusStopCode: BusStopCode}}
        }
        return bus_stops.filter((bus_stop) => { return bus_stop.BusStopCode.includes(BusStopCode) });
    })

    // MARK: GET NEAREST BUS STOPS
    fastify.get('/bus/nearest/:page', async (request, reply) => {
        var lat = request.query.lat
        var long = request.query.long
        var page = request.params.page
        // each page contain 20 index, starting from page 1
        if (isNaN(lat) || isNaN(long)) {
            return {response: 'error', error: 'invalid coordinates input', parameters: {lat: lat, long: long}}
        }

        if (isNaN(page)) {
            return {response: 'error', error: 'invalid page input', parameters: {page: page}}
        }

        if (Number(page) < 1) {
            return {response: 'error', error: 'invalid page number, min page is 1', parameters: {page: page}}
        }

        page = Math.ceil(Number(page))

        lat = Math.floor(Number(lat) * 10000) / 10000
        long = Math.floor(Number(long) * 10000) / 10000

        let nearest_bus_stops = await retrieveNearestLocation(lat, long);
        if (nearest_bus_stops) {
            const max_page = nearest_bus_stops.length / 20
            if (Math.ceil(max_page) <= page) {
                return nearest_bus_stops.splice((Math.floor(max_page) * 20), nearest_bus_stops.length - 1);
            }

            return nearest_bus_stops.splice(((page - 1) * 20), (page * 20));
        }

        const sort_bus_stops = []
        const bus_stops = await retrieveBusStops();

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
            sort_bus_stops.push(bus_stop)
        }
        
        // quick sort algo
        function swap(items, leftIndex, rightIndex){
            var temp = items[leftIndex];
            items[leftIndex] = items[rightIndex];
            items[rightIndex] = temp;
        }

        function partition(items, left, right) {
            let pivot   = items[Math.floor((right + left) / 2)] //middle element
            let i       = left //left pointer
            let j       = right; //right pointer
            while (i <= j) {
                while (items[i].distance < pivot.distance) {
                    i++;
                }
                while (items[j].distance > pivot.distance) {
                    j--;
                }
                if (i <= j) {
                    swap(items, i, j); //sawpping two elements
                    i++;
                    j--;
                }
            }
            return i;
        }
        
        function quickSort(items, left, right) {
            var index;
            if (items.length > 1) {
                index = partition(items, left, right);
                if (left < index - 1) {
                    quickSort(items, left, index - 1);
                }
                if (index < right) {
                    quickSort(items, index, right);
                }
            }
            return items;
        }

        const sorted_bus_stops = quickSort(sort_bus_stops, 0, sort_bus_stops.length - 1)
        await storingNearestLocation(lat, long, sorted_bus_stops);

        const max_page = nearest_bus_stops.length / 20
        if (Math.ceil(max_page) < page) {
            return nearest_bus_stops.splice((Math.floor(max_page) * 20), nearest_bus_stops.length - 1);
        }

        return nearest_bus_stops.splice((page * 20), nearest_bus_stops.length - 1);
    })

    // MARK: VIEW DATA CACHE STYLE
    fastify.get('/view/buses', async (request, reply) => {
        const buses = await getBuses()
        const bus_routes = await getBusRoutes()
        for (let i in bus_routes) {
            let bus_route = bus_routes[i];
            let index = buses.findIndex((bus) => {return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)})
            if (index < 0) { continue; }

            let value = {
                StopSequence: bus_route.StopSequence,
                BusStopCode: bus_route.BusStopCode,
                Distance: bus_route.Distance,
                WD_FirstBus: bus_route.WD_FirstBus,
                WD_LastBus: bus_route.WD_LastBus,
                SAT_FirstBus: bus_route.SAT_FirstBus,
                SAT_LastBus: bus_route.SAT_LastBus,
                SUN_FirstBus: bus_route.SUN_FirstBus,
                SUN_LastBus: bus_route.SUN_LastBus,
            }
            if (buses[index].Route == undefined || 
                buses[index].Route == null) {
                    buses[index].Route = [value]
            } else {
                buses[index].Route.push(value)
            }
        }

        return buses
    })

    fastify.get('/view/bus_stops', async (request, reply) => {
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

        return bus_stops
    });
}