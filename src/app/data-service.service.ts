//import { Gemeinde } from './request.model';
import { Injectable } from '@angular/core';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import * as xml2js from 'xml2js';


@Injectable({
  providedIn: 'root'
})
export class DataServiceService {

  private base_url = 'https://api.opentransportdata.swiss/ojp2020';

  constructor(private http: HttpClient) {


   }


   public ZielKoordinaten = [
    [
      {
        "Gemeinde": "Zürich",
        "Latitude": 47.36950058,
        "Longitude": 8.538847216
      },
      {
        "Gemeinde": "Bern",
        "Latitude": 46.94838422,
        "Longitude": 7.439946015
      },
      {
        "Gemeinde": "Basel",
        "Latitude": 47.55901659,
        "Longitude": 7.588759976
      },
      {
        "Gemeinde": "Lausanne",
        "Latitude": 46.52003853,
        "Longitude": 6.63327926
      },
      {
        "Gemeinde": "Genève",
        "Latitude": 46.20510756,
        "Longitude": 6.142975618
      },
    ]
  ]

  parseString = require('xml2js').parseString;
  private body: string;
  dataXML;
  dataJSON;
  result;
  tessst;




   async tripRequest(StartGemeinde: string, Longitude: number, Latitude: number) {

    this.setBody(StartGemeinde, Longitude, Latitude);

    let headers = new HttpHeaders()
      .set('Authorization', '57c5dbbbf1fe4d000100001842c323fa9ff44fbba0b9b925f0c052d1')
      .set('Content-Type', 'application/xml')

    this.dataXML = await this.http.post(this.base_url, this.body, { headers, responseType: 'application/xml' as 'json' }).toPromise();
    this.dataJSON = await parseXml(this.dataXML)
    return this.dataJSON;


}




setBody(StartGemeinde: string, Longitude: number, Latitude: number ){

    this.body =

    `<?xml version="1.0" encoding="utf-8"?>
    <OJP xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.siri.org.uk/siri" version="1.0" xmlns:ojp="http://www.vdv.de/ojp" xsi:schemaLocation="http://www.siri.org.uk/siri ../ojp-xsd-v1.0/OJP.xsd">
        <OJPRequest>
            <ServiceRequest>
                <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
                <RequestorRef>API-Explorer</RequestorRef>


                <ojp:OJPTripRequest>
                    <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
                    <ojp:Origin>
                        <ojp:PlaceRef>
                            <ojp:LocationName>
                                <ojp:Text>${StartGemeinde}</ojp:Text>
                            </ojp:LocationName>
                            <ojp:GeoPosition>
                                <Longitude>${Longitude}</Longitude>
                                <Latitude>${Latitude}</Latitude>
                            </ojp:GeoPosition>
                        </ojp:PlaceRef>
                        <ojp:DepArrTime>2020-10-01T08:00:00</ojp:DepArrTime>
                    </ojp:Origin>
                    <ojp:Destination>
                        <ojp:PlaceRef>
                            <ojp:LocationName>
                                <obj:Text>Zürich</obj:Text>
                            </ojp:LocationName>
                            <ojp:GeoPosition>
                                <Longitude>8.538847216</Longitude>
                                <Latitude>47.36950058</Latitude>
                            </ojp:GeoPosition>
                        </ojp:PlaceRef>
                    </ojp:Destination>
                    <ojp:Params>
                        <ojp:IncludeTrackSections></ojp:IncludeTrackSections>
                        <ojp:IncludeTurnDescription></ojp:IncludeTurnDescription>
                        <ojp:IncludeIntermediateStops></ojp:IncludeIntermediateStops>
                        <ojp:NumberOfResults>10</ojp:NumberOfResults>
                    </ojp:Params>
              </ojp:OJPTripRequest>

                <ojp:OJPTripRequest>
                    <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
                    <ojp:Origin>
                        <ojp:PlaceRef>
                            <ojp:LocationName>
                                <ojp:Text>${StartGemeinde}</ojp:Text>
                            </ojp:LocationName>
                            <ojp:GeoPosition>
                                <Longitude>${Longitude}</Longitude>
                                <Latitude>${Latitude}</Latitude>
                            </ojp:GeoPosition>
                        </ojp:PlaceRef>
                        <ojp:DepArrTime>2020-10-01T08:00:00</ojp:DepArrTime>
                    </ojp:Origin>
                    <ojp:Destination>
                        <ojp:PlaceRef>
                            <ojp:LocationName>
                                <obj:Text>Bern</obj:Text>
                            </ojp:LocationName>
                            <ojp:GeoPosition>
                                <Longitude>7.439946015</Longitude>
                                <Latitude>46.94838422</Latitude>
                            </ojp:GeoPosition>
                        </ojp:PlaceRef>
                    </ojp:Destination>
                    <ojp:Params>
                        <ojp:IncludeTrackSections></ojp:IncludeTrackSections>
                        <ojp:IncludeTurnDescription></ojp:IncludeTurnDescription>
                        <ojp:IncludeIntermediateStops></ojp:IncludeIntermediateStops>
                        <ojp:NumberOfResults>10</ojp:NumberOfResults>
                    </ojp:Params>
                </ojp:OJPTripRequest>

              <ojp:OJPTripRequest>
                <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
                <ojp:Origin>
                    <ojp:PlaceRef>
                        <ojp:LocationName>
                            <ojp:Text>${StartGemeinde}</ojp:Text>
                        </ojp:LocationName>
                        <ojp:GeoPosition>
                            <Longitude>${Longitude}</Longitude>
                            <Latitude>${Latitude}</Latitude>
                        </ojp:GeoPosition>
                    </ojp:PlaceRef>
                    <ojp:DepArrTime>2020-10-01T08:00:00</ojp:DepArrTime>
                </ojp:Origin>
                <ojp:Destination>
                    <ojp:PlaceRef>
                        <ojp:LocationName>
                            <obj:Text>Basel</obj:Text>
                        </ojp:LocationName>
                        <ojp:GeoPosition>
                            <Longitude>7.588759976</Longitude>
                            <Latitude>47.55901659</Latitude>
                        </ojp:GeoPosition>
                    </ojp:PlaceRef>
                </ojp:Destination>
                <ojp:Params>
                    <ojp:IncludeTrackSections></ojp:IncludeTrackSections>
                    <ojp:IncludeTurnDescription></ojp:IncludeTurnDescription>
                    <ojp:IncludeIntermediateStops></ojp:IncludeIntermediateStops>
                    <ojp:NumberOfResults>10</ojp:NumberOfResults>
                </ojp:Params>
            </ojp:OJPTripRequest>

            <ojp:OJPTripRequest>
            <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
            <ojp:Origin>
                <ojp:PlaceRef>
                    <ojp:LocationName>
                        <ojp:Text>${StartGemeinde}</ojp:Text>
                    </ojp:LocationName>
                    <ojp:GeoPosition>
                        <Longitude>${Longitude}</Longitude>
                        <Latitude>${Latitude}</Latitude>
                    </ojp:GeoPosition>
                </ojp:PlaceRef>
                <ojp:DepArrTime>2020-10-01T08:00:00</ojp:DepArrTime>
            </ojp:Origin>
            <ojp:Destination>
                <ojp:PlaceRef>
                    <ojp:LocationName>
                        <obj:Text>Lausanne</obj:Text>
                    </ojp:LocationName>
                    <ojp:GeoPosition>
                        <Longitude>6.63327926</Longitude>
                        <Latitude>46.52003853</Latitude>
                    </ojp:GeoPosition>
                </ojp:PlaceRef>
            </ojp:Destination>
            <ojp:Params>
                <ojp:IncludeTrackSections></ojp:IncludeTrackSections>
                <ojp:IncludeTurnDescription></ojp:IncludeTurnDescription>
                <ojp:IncludeIntermediateStops></ojp:IncludeIntermediateStops>
                <ojp:NumberOfResults>10</ojp:NumberOfResults>
            </ojp:Params>
        </ojp:OJPTripRequest>

        <ojp:OJPTripRequest>
            <RequestTimestamp>2020-09-30T19:37:44.336Z</RequestTimestamp>
            <ojp:Origin>
                <ojp:PlaceRef>
                    <ojp:LocationName>
                        <ojp:Text>${StartGemeinde}</ojp:Text>
                    </ojp:LocationName>
                    <ojp:GeoPosition>
                        <Longitude>${Longitude}</Longitude>
                        <Latitude>${Latitude}</Latitude>
                    </ojp:GeoPosition>
                </ojp:PlaceRef>
                <ojp:DepArrTime>2020-10-01T08:00:00</ojp:DepArrTime>
            </ojp:Origin>
            <ojp:Destination>
                <ojp:PlaceRef>
                    <ojp:LocationName>
                        <obj:Text>Genève</obj:Text>
                    </ojp:LocationName>
                    <ojp:GeoPosition>
                        <Longitude>6.142975618</Longitude>
                        <Latitude>46.20510756</Latitude>
                    </ojp:GeoPosition>
                </ojp:PlaceRef>
            </ojp:Destination>
            <ojp:Params>
                <ojp:IncludeTrackSections></ojp:IncludeTrackSections>
                <ojp:IncludeTurnDescription></ojp:IncludeTurnDescription>
                <ojp:IncludeIntermediateStops></ojp:IncludeIntermediateStops>
                <ojp:NumberOfResults>10</ojp:NumberOfResults>
            </ojp:Params>
        </ojp:OJPTripRequest>



            </ServiceRequest>
        </OJPRequest>
    </OJP>`


  }


}

async function parseXml(xmlStr) {
  var result;
  var parser = require('xml2js');
  parser.Parser().parseString(xmlStr, (e, r) => {result = r});
  return result;
}





