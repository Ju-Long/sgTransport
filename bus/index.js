const {
    getBusStopArrival,
    getBusArrival,
    getBusRoutes,
    getBuses,
    getBusStops
} = require('./scripts/requests');
const {
    cache,
    storingBusStopTiming,
    storingBusTiming,
    storingNearestLocation
} = require('./scripts/caching');
const {
    retrieveBusStops,
    retrieveBuses,
    retrieveBus,
    retrieveBusStopTiming,
    retrieveBusTiming,
    retrieveNearestLocation,
    retrieveBusStop
} = require('./scripts/retrieving');
const RequestError = require('./scripts/error')
const adult_fares = require('../assets/adult_fare.json');
const student_fares = require('../assets/student_fare.json');
const elder_fares = require('../assets/elder_fare.json');
const workfares = require('../assets/workfare_transport_concession.json');

module.exports = async (fastify, opts) => {
    fastify.get('/bus/cache', async (request, reply) => {
        return await cache()
    });

    // MARK: GET BUS DISTANCE
    fastify.get('/bus/distance/Bus/:ServiceNo/:StartBusStopCode/:EndBusStopCode', async (request, reply) => {
        try {
            const StartBusStopCode = request.params.StartBusStopCode;
            const EndBusStopCode = request.params.EndBusStopCode;
            const ServiceNo = request.params.ServiceNo;
            var fare = request.query.fare;
            if (!StartBusStopCode || !EndBusStopCode || !ServiceNo) {
                throw new RequestError('invalid Bus Stop Codes input', {
                    StartBusStopCode: StartBusStopCode,
                    EndBusStopCode: EndBusStopCode
                }, new Error().stack);
            }

            if (!fare) {
                fare = "Adult"
            }

            let bus_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
            let bus_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);

            if (bus_in_start_bus_stop.length === 0) {
                await cache();
                bus_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
            }
            if (bus_in_start_bus_stop === 0) {
                throw new RequestError('no Start Bus Stop Code can be found', {
                    StartBusStopCode: StartBusStopCode
                }, new Error().stack);
                return {
                    response: 'error',
                    error: 'no Start Bus Stop Code can be found',
                    parameters: {
                        StartBusStopCode: StartBusStopCode
                    }
                }
            }

            if (bus_in_end_bus_stop === 0) {
                await cache();
                bus_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);
            }
            if (bus_in_end_bus_stop === 0) {
                throw new RequestError('no End Bus Stop Code can be found', {
                    EndBusStopCode: EndBusStopCode
                }, new Error().stack);
            }

            let bus = null;
            let bus_start_index = bus_in_start_bus_stop.Buses.findIndex((bus) => {
                return bus.ServiceNo === ServiceNo;
            });
            let bus_end_index = bus_in_end_bus_stop.Buses.findIndex((bus) => {
                return bus.ServiceNo === ServiceNo;
            });
            if (bus_start_index < 0 || bus_end_index < 0) {
                throw new RequestError('No Bus Found on the selected bus stop', {}, new Error().stack);
            }

            if (bus_in_start_bus_stop.Buses[bus_start_index].Direction !== bus_in_end_bus_stop.Buses[bus_end_index].Direction) {
                throw new RequestError('The bus stop are not in the same direction', {}, new Error().stack);
            }

            bus = await retrieveBus(ServiceNo, bus_in_start_bus_stop.Buses[bus_start_index].Direction);
            let start_bus_route_index = bus.Route.findIndex((bus_stop) => {
                return bus_stop.BusStopCode === StartBusStopCode
            });
            if (start_bus_route_index < 0) {
                throw new RequestError('Start Bus Stop Code Not found on route', {
                    BusStopCode: StartBusStopCode,
                    bus: bus
                }, new Error().stack);
            }

            let end_bus_route_index = bus.Route.findIndex((bus_stop) => {
                return bus_stop.BusStopCode === EndBusStopCode
            });
            if (end_bus_route_index < 0) {
                throw new RequestError('End Bus Stop Code Not found on route', {
                    ServiceNo: bus.ServiceNo,
                    BusStopCode: StartBusStopCode
                }, new Error().stack);
            }

            if (start_bus_route_index >= end_bus_route_index) {
                if (start_bus_route_index !== 0 && start_bus_route_index !== bus.Route.length - 1 && end_bus_route_index !== 0 && end_bus_route_index !== bus.Route.length - 1) {
                    throw new RequestError('the Start Bus Stop Code is later or the same the End Bus Stop Code', {}, new Error().stack);
                }

                switch (bus_in_start_bus_stop.Buses[bus_start_index].Direction) {
                    case 1:
                        bus = await retrieveBus(ServiceNo, 2);
                        break;

                    case 2:
                        bus = await retrieveBus(ServiceNo, 1);
                        break;
                }

                start_bus_route_index = bus.Route.findIndex((bus_stop) => {
                    return bus_stop.BusStopCode === StartBusStopCode
                });
                if (start_bus_route_index < 0) {
                    throw new RequestError('Start Bus Stop Code Not found on route', {
                        BusStopCode: StartBusStopCode,
                        bus: bus
                    }, new Error().stack);
                }

                end_bus_route_index = bus.Route.findIndex((bus_stop) => {
                    return bus_stop.BusStopCode === EndBusStopCode
                });
                if (end_bus_route_index < 0) {
                    throw new RequestError('End Bus Stop Code Not found on route', {
                        ServiceNo: bus.ServiceNo,
                        BusStopCode: StartBusStopCode
                    }, new Error().stack);
                }

                if (start_bus_route_index >= end_bus_route_index) {
                    throw new RequestError('the Start Bus Stop Code is later or the same the End Bus Stop Code', {}, new Error().stack);
                }
            }

            let start_bus_stop = bus.Route[start_bus_route_index];
            let end_bus_stop = bus.Route[end_bus_route_index];
            let dist_diff = end_bus_stop.Distance - start_bus_stop.Distance
            let dist_cost = 0.0
            switch (fare) {
                case "Adult":
                    adult_fares.forEach(adult_fare => {
                        if (adult_fare.min_distance < dist_diff && adult_fare.max_distance > dist_diff)
                            dist_cost = adult_fare.card_fare.basic_bus
                    });
                    break;

                case "Student":
                    student_fares.forEach(student_fare => {
                        if (student_fare.min_distance < dist_diff && student_fare.max_distance > dist_diff)
                            dist_cost = student_fare.card_fare.basic_bus
                    });
                    break;

                case "Elder":
                    elder_fares.forEach(elder_fare => {
                        if (elder_fare.min_distance < dist_diff && elder_fare.max_distance > dist_diff)
                            dist_cost = elder_fare.card_fare.basic_bus
                    })
                    break;

                case "Workfare":
                    workfares.forEach(workfare => {
                        if (workfare.min_distance < dist_diff && workfare.max_distance > dist_diff)
                            dist_cost = workfare.card_fare.basic_bus
                    })
                    break;
            }

            return {
                ServiceNo: bus.ServiceNo,
                Direction: bus.Direction,
                Fare: dist_cost,
                DistanceDifference: dist_diff,
                Routes: bus.Route.splice(start_bus_route_index + 1, (end_bus_route_index - start_bus_route_index))
            };
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            };
        }
    });

    // MARK: GET BUS DISTANCE AT BUS STOP
    fastify.get('/bus/distance/BusStop/:StartBusStopCode/:EndBusStopCode', async (request, reply) => {
        try {
            const StartBusStopCode = request.params.StartBusStopCode;
            const EndBusStopCode = request.params.EndBusStopCode;
            var fare = request.query.fare;
            if (!StartBusStopCode || !EndBusStopCode) {
                throw new RequestError('invalid Bus Stop Codes input', {
                    StartBusStopCode: StartBusStopCode,
                    EndBusStopCode: EndBusStopCode
                }, new Error().stack);
            }

            if (!fare) {
                fare = "Adult"
            }

            let buses_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
            let buses_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);

            if (buses_in_start_bus_stop.length === 0) {
                await cache();
                buses_in_start_bus_stop = await retrieveBusStop(StartBusStopCode);
            }
            if (buses_in_start_bus_stop === 0) {
                throw new RequestError('no Start Bus Stop Code can be found', {
                    StartBusStopCode: StartBusStopCode
                }, new Error().stack);
            }

            if (buses_in_end_bus_stop === 0) {
                await cache();
                buses_in_end_bus_stop = await retrieveBusStop(EndBusStopCode);
            }
            if (buses_in_end_bus_stop === 0) {
                throw new RequestError('no End Bus Stop Code can be found', {
                    EndBusStopCode: EndBusStopCode
                }, new Error().stack);
            }

            var buses_available = [];
            for (let i in buses_in_start_bus_stop.Buses) {
                let start_bus = buses_in_start_bus_stop.Buses[i];
                for (let n in buses_in_end_bus_stop.Buses) {
                    let end_bus = buses_in_end_bus_stop.Buses[n];
                    if (start_bus.ServiceNo === end_bus.ServiceNo && start_bus.Direction === end_bus.Direction) {
                        buses_available.push({
                            ServiceNo: start_bus.ServiceNo,
                            Direction: start_bus.Direction
                        });
                    }
                }
            }

            if (buses_available.length < 1) {
                throw new RequestError('No direct route found', {}, new Error().stack);
            }

            var response = [];
            for (let i in buses_available) {
                let bus_available = buses_available[i];

                let bus = await retrieveBus(bus_available.ServiceNo, bus_available.Direction);
                let start_bus_route_index = bus.Route.findIndex((bus_stop) => {
                    return bus_stop.BusStopCode === StartBusStopCode
                });
                if (start_bus_route_index < 0) {
                    throw new RequestError('Start Bus Stop Code Not found on route', {
                        StartBusStopCode: StartBusStopCode,
                        bus: bus
                    }, new Error().stack);
                }
                let end_bus_route_index = bus.Route.findIndex((bus_stop) => {
                    return bus_stop.BusStopCode === EndBusStopCode
                });
                if (end_bus_route_index < 0) {
                    throw new RequestError('End Bus Stop Code Not found on route', {
                        bus: bus,
                        BusStopCode: StartBusStopCode
                    }, new Error().stack);
                }

                if (start_bus_route_index >= end_bus_route_index) {
                    if (start_bus_route_index !== 0 && start_bus_route_index !== bus.Route.length - 1 && end_bus_route_index !== 0 && end_bus_route_index !== bus.Route.length - 1) {
                        throw new RequestError('the Start Bus Stop Code is later or the same the End Bus Stop Code', {}, new Error().stack);
                    }

                    switch (bus_available.Direction) {
                        case 1:
                            bus = await retrieveBus(ServiceNo, 2);
                            break;

                        case 2:
                            bus = await retrieveBus(ServiceNo, 1);
                            break;
                    }

                    start_bus_route_index = bus.Route.findIndex((bus_stop) => {
                        return bus_stop.BusStopCode === StartBusStopCode
                    });
                    if (start_bus_route_index < 0) {
                        throw new RequestError('Start Bus Stop Code Not found on route', {}, new Error().stack);
                    }
                    end_bus_route_index = bus.Route.findIndex((bus_stop) => {
                        return bus_stop.BusStopCode === EndBusStopCode
                    });
                    if (end_bus_route_index < 0) {
                        throw new RequestError('End Bus Stop Code Not found on route', {}, new Error().stack);
                    }

                    if (start_bus_route_index >= end_bus_route_index) {
                        throw new RequestError('the Start Bus Stop Code is later or the same the End Bus Stop Code', {}, new Error().stack);
                    }
                }

                let start_bus_stop = bus.Route[start_bus_route_index];
                let end_bus_stop = bus.Route[end_bus_route_index];
                let dist_diff = end_bus_stop.Distance - start_bus_stop.Distance
                let dist_cost = 0.0
                switch (fare) {
                    case "Adult":
                        adult_fares.forEach(adult_fare => {
                            if (adult_fare.min_distance < dist_diff && adult_fare.max_distance > dist_diff)
                                dist_cost = adult_fare.card_fare.basic_bus
                        });
                        break;

                    case "Student":
                        student_fares.forEach(student_fare => {
                            if (student_fare.min_distance < dist_diff && student_fare.max_distance > dist_diff)
                                dist_cost = student_fare.card_fare.basic_bus
                        });
                        break;

                    case "Elder":
                        elder_fares.forEach(elder_fare => {
                            if (elder_fare.min_distance < dist_diff && elder_fare.max_distance > dist_diff)
                                dist_cost = elder_fare.card_fare.basic_bus
                        })
                        break;

                    case "Workfare":
                        workfares.forEach(workfare => {
                            if (workfare.min_distance < dist_diff && workfare.max_distance > dist_diff)
                                dist_cost = workfare.card_fare.basic_bus
                        })
                        break;
                }

                response.push({
                    ServiceNo: bus_available.ServiceNo,
                    Direction: bus_available.Direction,
                    Fare: dist_cost,
                    DistanceDifference: dist_diff,
                    Routes: bus.Route.splice(start_bus_route_index + 1, (end_bus_route_index - start_bus_route_index))
                });
            }
            return response;
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            }
        }
    })

    // MARK: GET BUS STOP BUS TIMING TIMING
    fastify.get('/bus/timing/BusStop/:BusStopCode', async (request, reply) => {
        try {
            const BusStopCode = request.params.BusStopCode
            if (!BusStopCode) {
                throw new RequestError('invalid Bus Stop Code input', {
                    BusStopCode: BusStopCode
                }, new Error().stack);
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
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            }
        }
    })

    // MARK: GET BUS FULL DATA
    fastify.get('/bus/Bus/:ServiceNo/:Direction', async (request, reply) => {
        try {
            const ServiceNo = request.params.ServiceNo
            const Direction = request.params.Direction
            if (!ServiceNo || !Direction) {
                throw new RequestError('invalid Service No input', {
                    ServiceNo: ServiceNo,
                    Direction: Direction
                }, new Error().stack);
            }

            let bus = await retrieveBus(ServiceNo, Direction);
            if (bus === undefined) {
                await cache();
                bus = await retrieveBus(ServiceNo, Direction);
            }
            if (bus === undefined) {
                console.log("bus is empty")
                throw new RequestError('Service Number Could not be found', {
                    ServiceNo: ServiceNo,
                    Direction: Direction
                }, new Error().stack);
            }

            for (let i in bus.Route) {
                let bus_stop = await retrieveBusStop(bus.Route[i].BusStopCode);
                if (bus_stop === undefined) {
                    continue;
                }

                bus.Route[i].Latitude = bus_stop.Latitude
                bus.Route[i].Longitude = bus_stop.Longitude
                bus.Route[i].Description = bus_stop.Description
                bus.Route[i].RoadName = bus_stop.RoadName
            }

            return bus
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            }
        }
    })

    // MARK: SEARCH FOR BUS
    fastify.get('/bus/search/Bus/:ServiceNo', async (request, reply) => {
        try {
            const ServiceNo = request.params.ServiceNo
            if (!ServiceNo) {
                throw new RequestError('invalid Service No input', {
                    ServiceNo: ServiceNo
                }, new Error().stack);
            }

            let buses = await retrieveBuses();
            if (buses.length < 1) {
                await cache();
                bus = await retrieveBuses();
            }
            if (buses.length < 1) {
                throw new RequestError('Service Number Could not be found', {
                    ServiceNo: ServiceNo
                }, new Error().stack);
            }
            return buses.filter((bus) => {
                return bus.ServiceNo.includes(ServiceNo)
            });
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            }
        }
    })

    // MARK: SEARCH FOR BUS STOP
    fastify.get('/bus/search/BusStop/:BusStopCode', async (request, reply) => {
        try {
            const BusStopCode = request.params.BusStopCode
            if (!BusStopCode) {
                throw new RequestError('invalid Bus Stop Code input', {
                    BusStopCode: BusStopCode
                }, new Error().stack);
            }

            let bus_stops = await retrieveBusStops();
            if (bus_stops.length < 1) {
                await cache();
                bus_stops = await retrieveBusStops();
            }
            if (bus_stops.length < 1) {
                throw new RequestError('Bus Stop Code Could not be found', {
                    BusStopCode: BusStopCode
                }, new Error().stack);
            }

            return bus_stops.filter((bus_stop) => {
                return bus_stop.BusStopCode.includes(BusStopCode)
            });
        } catch (error) {
            return {
                response: 'error',
                error: error.message,
                parameters: error.parameters,
                line: error.line
            }
        }
    })

    // MARK: GET NEAREST BUS STOPS
    fastify.get('/bus/nearest/:page', async (request, reply) => {
        var lat = request.query.lat
        var long = request.query.long
        var page = request.params.page
        // each page contain 20 index, starting from page 1
        if (isNaN(lat) || isNaN(long)) {
            throw new RequestError('invalid coordinates input', {
                lat: lat,
                long: long
            }, new Error().stack);
        }

        if (isNaN(page)) {
            throw new RequestError('invalid page input', {
                page: page
            }, new Error().stack);
        }

        if (Number(page) < 1) {
            throw new RequestError('invalid page number, min page is 1', {
                page: page
            }, new Error().stack);
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

            let radlat1 = Math.PI * Number(lat) / 180
            let radlat2 = Math.PI * Number(bus_stop.Latitude) / 180
            let theta = Number(long) - Number(bus_stop.Longitude)
            let radtheta = Math.PI * theta / 180
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            dist = Math.acos(dist)
            dist = dist * 180 / Math.PI
            dist = dist * 60 * 1.1515
            dist = dist * 1.609344

            bus_stop.distance = dist
            sort_bus_stops.push(bus_stop)
        }

        // quick sort algo
        function swap(items, leftIndex, rightIndex) {
            var temp = items[leftIndex];
            items[leftIndex] = items[rightIndex];
            items[rightIndex] = temp;
        }

        function partition(items, left, right) {
            let pivot = items[Math.floor((right + left) / 2)] //middle element
            let i = left //left pointer
            let j = right; //right pointer
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

        const max_page = sorted_bus_stops.length / 20
        if (Math.ceil(max_page) <= page) {
            return sorted_bus_stops.splice((Math.floor(max_page) * 20), sorted_bus_stops.length - 1);
        }

        return sorted_bus_stops.splice(((page - 1) * 20), (page * 20));
    })

    // MARK: VIEW DATA CACHE STYLE
    fastify.get('/view/buses', async (request, reply) => {
        const buses = await getBuses()
        const bus_routes = await getBusRoutes()
        for (let i in bus_routes) {
            let bus_route = bus_routes[i];
            let index = buses.findIndex((bus) => {
                return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)
            })
            if (index < 0) {
                continue;
            }

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
            let index = bus_stops.findIndex((bus_stop) => {
                return bus_stop.BusStopCode === bus_route.BusStopCode
            })
            if (index < 0) {
                continue;
            }

            let bus_index = buses.findIndex((bus) => {
                return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)
            })

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