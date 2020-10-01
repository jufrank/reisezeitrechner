import { Gemeinde } from './../request.model';
import { DataServiceService } from './../data-service.service';
import { Component, OnInit } from '@angular/core';
import { FormControl } from "@angular/forms";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';

//Form template found at: https://stackblitz.com/edit/angular-ng-autocomplete-with-forms?file=src%2Fapp%2Fapp.component.html
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  maxDataValue;
  ReisedauerAlleStaedte: any = []
  suchwort;
  NameTest;
  ungueltigerName=0;


  public barChartData: ChartDataSets[] = [];
  public barChartOptions: ChartOptions ={

    layout: {
      padding: {
        top:30
      }
    },
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      xAxes: [{
      gridLines: {
        drawBorder: true, lineWidth: 0, zeroLineColor: 'black'

     },
     ticks: {

      fontColor: 'black'
  },
    }],
     yAxes: [{


      gridLines: {
        drawBorder: true, lineWidth: 0, zeroLineColor: 'black'
     },
     ticks: {
      stepSize:50,
      suggestedMin:0,
      suggestedMax: 1,
      padding: 15,
      fontColor: 'black',




  },
  scaleLabel: {
    display: true,
    labelString: 'Minuten',
    fontColor: 'black',
  }
    }] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: 'black'
      }
    },
    tooltips: {

      callbacks: {
          label: function(tooltipItem, data) {
              return "Reisezeit von "+ (data.datasets[tooltipItem.datasetIndex].label) +" nach " + (tooltipItem.xLabel) +" : " + (tooltipItem.yLabel) + " Minuten";
          }
      }
  }


  };


  public barChartLabels: Label[] = ['Zürich', 'Bern', 'Basel', 'Lausanne', 'Genf'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [pluginDataLabels];



  faSearch = faSearch;
  name = '';

  /**
   * Form
   */
  reactiveForm: FormGroup;
  ReisedauerArray: number []
  //schnellsterWeg;

  public placeholder: string = 'Nach Gemeinde suchen';
  public keyword = 'name';
  public historyHeading: string = 'Kürzlich gesucht';
  public API_Response

  alert=0;
  loading=0;


  constructor(private dataService: DataServiceService, private _fb: FormBuilder, ) {
    this.reactiveForm = _fb.group({
      name: [{value: '', disabled: false}, Validators.required]
    });
  }

  ngOnInit() {

  }



  /**
   * Formulareingabe an API schicken, via data-service
   */
  async submitTemplateForm(value) {
    this.alert=0;
    this.ungueltigerName = 0;
    this.NameTest = 0;
    this.loading=1;
    this.ReisedauerAlleStaedte = []
    this.suchwort = value.name;

    if (this.suchwort === "") {
      this.loading=0;
      this.alert=1;
      return
    }

    //Testen ob Gemeindename gültig
    for(let i=0;i<this.gemeinden.length;i++) {
      if (this.suchwort == this.gemeinden[i]) {
        this.NameTest++;
      }
    }
    if( this.NameTest!=1) {
      this.ungueltigerName=1;
      this.loading=0;
      return
    }

    let longitude = await this.findLongitude(this.suchwort)
    let latitude = await this.findLatitude(this.suchwort)
    this.API_Response =  await this.dataService.tripRequest(this.suchwort, longitude, latitude);
    //loop über alle Zielstädte
    for (let z = 0; z < 5; z++) {
          // Reisezeit aus der verschiedenen Verbindungen aus der API Antwort auslesen, vergleichen und schnellste wiedergeben
      let schnellsterWeg = await this.ReisezeitAuslesen(z);
      console.log(schnellsterWeg)
      this.ReisedauerAlleStaedte.push(schnellsterWeg)
      console.log(this.ReisedauerAlleStaedte)
    }



    //console.log(this.API_Response['siri:OJP']['siri:OJPResponse']['0']['siri:ServiceDelivery']['0']['ojp:OJPTripDelivery']['0']['ojp:TripResult'][0]['ojp:Trip']['0']['ojp:Duration']['0']);
    this.barChartData = [
      { data: [this.ReisedauerAlleStaedte[0],
              this.ReisedauerAlleStaedte[1],
              this.ReisedauerAlleStaedte[2],
              this.ReisedauerAlleStaedte[3],
              this.ReisedauerAlleStaedte[4],
              this.ReisedauerAlleStaedte[5]], label: this.suchwort, backgroundColor: 'rgb(17, 52, 68)',

               },

    ];

    this.loading=0;
  }

  ReisezeitAuslesen(z) {
    this.ReisedauerArray = []
    //Falls von einer Stadt zur Selben ist TripResult undefined -> dann Zeit auf 0 setzen
    if (this.API_Response['siri:OJP']['siri:OJPResponse']['0']['siri:ServiceDelivery']['0']['ojp:OJPTripDelivery'][z]['ojp:TripResult'] === undefined) {

      return 0
    }

    //Auswahl der Reisezeit-Information aus dem JSON Objekt
    length = this.API_Response['siri:OJP']['siri:OJPResponse']['0']['siri:ServiceDelivery']['0']['ojp:OJPTripDelivery'][z]['ojp:TripResult'].length


    //Umwwandlung der Information in numerischen Format
    for (let i=0; i<length; i++) {
      let time: string;
      time = this.API_Response['siri:OJP']['siri:OJPResponse']['0']['siri:ServiceDelivery']['0']['ojp:OJPTripDelivery'][z]['ojp:TripResult'][i]['ojp:Trip']['0']['ojp:Duration']['0']
      let splitted = time.split(/[PT]|[H]|[M]/)
      let reisedauer;

      if (splitted.length == 5) {
        reisedauer = parseFloat(splitted[2])*60+parseFloat(splitted[3]);
        this.ReisedauerArray.push(reisedauer)

       } else {
        reisedauer = parseFloat(splitted[2]);
        this.ReisedauerArray.push(reisedauer)

      }
    }
    //Minimum finden
    return Math.min.apply(Math, this.ReisedauerArray)
  }

  async findLongitude(SuchGemeinde: string) {
      for (var i = 0; i < this.GemeindenKoordinaten[0].length; i++){
        if(SuchGemeinde == this.GemeindenKoordinaten[0][i].Gemeinde) {

          return this.GemeindenKoordinaten[0][i].Longitude;
        }

    }

  }

  async findLatitude (SuchGemeinde: string) {
    for (var i = 0; i < this.GemeindenKoordinaten[0].length; i++){
      if(SuchGemeinde == this.GemeindenKoordinaten[0][i].Gemeinde) {

        return this.GemeindenKoordinaten[0][i].Latitude;
      }

  }
  }


/* DATA */
public gemeinden = [

'Aeugst am Albis','Affoltern am Albis','Bonstetten','Hausen am Albis','Hedingen','Kappel am Albis','Knonau','Maschwanden','Mettmenstetten','Obfelden','Ottenbach','Rifferswil','Stallikon','Wettswil am Albis','Adlikon','Benken (ZH)','Berg am Irchel','Buch am Irchel','Dachsen','Dorf','Feuerthalen','Flaach','Flurlingen','Andelfingen','Henggart','Humlikon','Kleinandelfingen','Laufen-Uhwiesen','Marthalen','Ossingen','Rheinau','Thalheim an der Thur','Trüllikon','Truttikon','Volken','Bachenbülach','Bassersdorf','Bülach','Dietlikon','Eglisau','Embrach','Freienstein-Teufen','Glattfelden','Hochfelden','Höri','Hüntwangen','Kloten','Lufingen','Nürensdorf','Oberembrach','Opfikon','Rafz','Rorbas','Wallisellen','Wasterkingen','Wil (ZH)','Winkel','Bachs','Boppelsen','Buchs (ZH)','Dällikon','Dänikon','Dielsdorf','Hüttikon','Neerach','Niederglatt','Niederhasli','Niederweningen','Oberglatt','Oberweningen','Otelfingen','Regensberg','Regensdorf','Rümlang','Schleinikon','Schöfflisdorf','Stadel','Steinmaur','Weiach','Bäretswil','Bubikon','Dürnten','Fischenthal','Gossau (ZH)','Grüningen','Hinwil','Rüti (ZH)','Seegräben','Wald (ZH)','Wetzikon (ZH)','Adliswil','Kilchberg (ZH)','Langnau am Albis','Oberrieden','Richterswil','Rüschlikon','Thalwil','Erlenbach (ZH)','Herrliberg','Hombrechtikon','Küsnacht (ZH)','Männedorf','Meilen','Oetwil am See','Stäfa','Uetikon am See','Zumikon','Zollikon','Fehraltorf','Hittnau','Lindau','Pfäffikon','Russikon','Weisslingen','Wila','Wildberg','Dübendorf','Egg','Fällanden','Greifensee','Maur','Mönchaltorf','Schwerzenbach','Uster','Volketswil','Wangen-Brüttisellen','Altikon','Brütten','Dägerlen','Dättlikon','Dinhard','Ellikon an der Thur','Elsau','Hagenbuch','Hettlingen','Neftenbach','Pfungen','Rickenbach (ZH)','Schlatt (ZH)','Seuzach','Turbenthal','Winterthur','Zell (ZH)','Aesch (ZH)','Birmensdorf (ZH)','Dietikon','Geroldswil','Oberengstringen','Oetwil an der Limmat','Schlieren','Uitikon','Unterengstringen','Urdorf','Weiningen (ZH)','Zürich','Stammheim','Wädenswil','Elgg','Horgen','Illnau-Effretikon','Bauma','Wiesendangen','Aarberg','Bargen (BE)','Grossaffoltern','Kallnach','Kappelen','Lyss','Meikirch','Radelfingen','Rapperswil (BE)','Schüpfen','Seedorf (BE)','Aarwangen','Auswil','Bannwil','Bleienbach','Busswil bei Melchnau','Gondiswil','Langenthal','Lotzwil','Madiswil','Melchnau','Obersteckholz','Oeschenbach','Reisiswil','Roggwil (BE)','Rohrbach','Rohrbachgraben','Rütschelen','Schwarzhäusern','Thunstetten','Ursenbach','Wynau','Bern','Bolligen','Bremgarten bei Bern','Kirchlindach','Köniz','Muri bei Bern','Oberbalm','Stettlen','Vechigen','Wohlen bei Bern','Zollikofen','Ittigen','Ostermundigen','Biel/Bienne','Evilard','Arch','Büetigen','Büren an der Aare','Diessbach bei Büren','Dotzigen','Lengnau (BE)','Leuzigen','Meienried','Meinisberg','Oberwil bei Büren','Pieterlen','Rüti bei Büren','Wengi','Aefligen','Alchenstorf','Bäriswil','Burgdorf','Ersigen','Hasle bei Burgdorf','Heimiswil','Hellsau','Hindelbank','Höchstetten','Kernenried','Kirchberg (BE)','Koppigen','Krauchthal','Lyssach','Mötschwil','Oberburg','Rüdtligen-Alchenflüh','Rumendingen','Rüti bei Lyssach','Willadingen','Wynigen','Corgémont','Cormoret','Cortébert','Courtelary','La Ferrière','Mont-Tramelan','Orvin','Renan (BE)','Romont (BE)','Saint-Imier','Sonceboz-Sombeval','Sonvilier','Tramelan','Villeret','Sauge','Péry-La Heutte','Brüttelen','Erlach','Finsterhennen','Gals','Gampelen','Ins','Lüscherz','Müntschemier','Siselen','Treiten','Tschugg','Vinelz','Bätterkinden','Deisswil bei Münchenbuchsee','Diemerswil','Fraubrunnen','Jegenstorf','Iffwil','Mattstetten','Moosseedorf','Münchenbuchsee','Urtenen-Schönbühl','Utzenstorf','Wiggiswil','Wiler bei Utzenstorf','Zielebach','Zuzwil (BE)','Adelboden','Aeschi bei Spiez','Frutigen','Kandergrund','Kandersteg','Krattigen','Reichenbach im Kandertal','Beatenberg','Bönigen','Brienz (BE)','Brienzwiler','Därligen','Grindelwald','Gsteigwiler','Gündlischwand','Habkern','Hofstetten bei Brienz','Interlaken','Iseltwald','Lauterbrunnen','Leissigen','Lütschental','Matten bei Interlaken','Niederried bei Interlaken','Oberried am Brienzersee','Ringgenberg (BE)','Saxeten','Schwanden bei Brienz','Unterseen','Wilderswil','Arni (BE)','Biglen','Bowil','Brenzikofen','Freimettigen','Grosshöchstetten','Häutligen','Herbligen','Kiesen','Konolfingen','Landiswil','Linden','Mirchel','Münsingen','Niederhünigen','Oberdiessbach','Oberthal','Oppligen','Rubigen','Walkringen','Worb','Zäziwil','Oberhünigen','Allmendingen','Wichtrach','Clavaleyres','Ferenbalm','Frauenkappelen','Gurbrü','Kriechenwil','Laupen','Mühleberg','Münchenwiler','Neuenegg','Wileroltigen','Belprahon','Champoz','Corcelles (BE)','Court','Crémines','Eschert','Grandval','Loveresse','Moutier','Perrefitte','Reconvilier','Roches (BE)','Saicourt','Saules (BE)','Schelten','Seehof','Sorvilier','Tavannes','Rebévelier','Petit-Val','Valbirse','La Neuveville','Nods','Plateau de Diesse','Aegerten','Bellmund','Brügg','Bühl','Epsach','Hagneck','Hermrigen','Jens','Ipsach','Ligerz','Merzligen','Mörigen','Nidau','Orpund','Port','Safnern','Scheuren','Schwadernau','Studen (BE)','Sutz-Lattrigen','Täuffelen','Walperswil','Worben','Twann-Tüscherz','Därstetten','Diemtigen','Erlenbach im Simmental','Oberwil im Simmental','Reutigen','Spiez','Wimmis','Stocken-Höfen','Guttannen','Hasliberg','Innertkirchen','Meiringen','Schattenhalb','Boltigen','Lenk','St. Stephan','Zweisimmen','Gsteig','Lauenen','Saanen','Guggisberg','Rüschegg','Schwarzenburg','Belp','Burgistein','Gerzensee','Gurzelen','Jaberg','Kaufdorf','Kehrsatz','Kirchdorf (BE)','Niedermuhlern','Riggisberg','Rüeggisberg','Rümligen','Seftigen','Toffen','Uttigen','Wattenwil','Wald (BE)','Thurnen','Eggiwil','Langnau im Emmental','Lauperswil','Röthenbach im Emmental','Rüderswil','Schangnau','Signau','Trub','Trubschachen','Amsoldingen','Blumenstein','Buchholterberg','Eriz','Fahrni','Heiligenschwendi','Heimberg','Hilterfingen','Homberg','Horrenbach-Buchen','Oberhofen am Thunersee','Oberlangenegg','Pohlern','Sigriswil','Steffisburg','Teuffenthal (BE)','Thierachern','Thun','Uebeschi','Uetendorf','Unterlangenegg','Wachseldorn','Zwieselberg','Forst-Längenbühl','Affoltern im Emmental','Dürrenroth','Eriswil','Huttwil','Lützelflüh','Rüegsau','Sumiswald','Trachselwald','Walterswil (BE)','Wyssachen','Attiswil','Berken','Bettenhausen','Farnern','Graben','Heimenhausen','Herzogenbuchsee','Inkwil','Niederbipp','Niederönz','Oberbipp','Ochlenberg','Rumisberg','Seeberg','Thörigen','Walliswil bei Niederbipp','Walliswil bei Wangen','Wangen an der Aare','Wangenried','Wiedlisbach','Doppleschwand','Entlebuch','Flühli','Hasle (LU)','Romoos','Schüpfheim','Werthenstein','Escholzmatt-Marbach','Aesch (LU)','Altwis','Ballwil','Emmen','Ermensee','Eschenbach (LU)','Hitzkirch','Hochdorf','Hohenrain','Inwil','Rain','Römerswil','Rothenburg','Schongau','Adligenswil','Buchrain','Dierikon','Ebikon','Gisikon','Greppen','Honau','Horw','Kriens','Luzern','Malters','Meggen','Meierskappel','Root','Schwarzenberg','Udligenswil','Vitznau','Weggis','Beromünster','Büron','Buttisholz','Eich','Geuensee','Grosswangen','Hildisrieden','Knutwil','Mauensee','Neuenkirch','Nottwil','Oberkirch','Rickenbach (LU)','Ruswil','Schenkon','Schlierbach','Sempach','Sursee','Triengen','Wolhusen','Alberswil','Altbüron','Altishofen','Dagmersellen','Egolzwil','Ettiswil','Fischbach','Gettnau','Grossdietwil','Hergiswil bei Willisau','Luthern','Menznau','Nebikon','Pfaffnau','Reiden','Roggliswil','Schötz','Ufhusen','Wauwil','Wikon','Zell (LU)','Willisau','Altdorf (UR)','Andermatt','Attinghausen','Bauen','Bürglen (UR)','Erstfeld','Flüelen','Göschenen','Gurtnellen','Hospental','Isenthal','Realp','Schattdorf','Seedorf (UR)','Seelisberg','Silenen','Sisikon','Spiringen','Unterschächen','Wassen','Einsiedeln','Gersau','Feusisberg','Freienbach','Wollerau','Küssnacht (SZ)','Altendorf','Galgenen','Innerthal','Lachen','Reichenburg','Schübelbach','Tuggen','Vorderthal','Wangen (SZ)','Alpthal','Arth','Illgau','Ingenbohl','Lauerz','Morschach','Muotathal','Oberiberg','Riemenstalden','Rothenthurm','Sattel','Schwyz','Steinen','Steinerberg','Unteriberg','Alpnach','Engelberg','Giswil','Kerns','Lungern','Sachseln','Sarnen','Beckenried','Buochs','Dallenwil','Emmetten','Ennetbürgen','Ennetmoos','Hergiswil (NW)','Oberdorf (NW)','Stans','Stansstad','Wolfenschiessen','Glarus Nord','Glarus Süd','Glarus','Baar','Cham','Hünenberg','Menzingen','Neuheim','Oberägeri','Risch','Steinhausen','Unterägeri','Walchwil','Zug','Châtillon (FR)','Cheiry','Cugy (FR)','Fétigny','Gletterens','Lully (FR)','Ménières','Montagny (FR)','Nuvilly','Prévondavaux','Saint-Aubin (FR)','Sévaz','Surpierre','Vallon','Les Montets','Delley-Portalban','Belmont-Broye','Estavayer','Cheyres-Châbles','Auboranges','Billens-Hennens','Chapelle (Glâne)','Le Châtelard','Châtonnaye','Ecublens (FR)','Grangettes','Massonnens','Mézières (FR)','Montet (Glâne)','Romont (FR)','Rue','Siviriez','Ursy','Vuisternens-devant-Romont','Villorsonnens','Torny','Villaz','Haut-Intyamon','Pont-en-Ogoz','Botterens','Broc','Bulle','Châtel-sur-Montsalvens','Corbières','Crésuz','Echarlens','Grandvillard','Gruyères','Hauteville','Jaun','Marsens','Morlon','Le Pâquier (FR)','Pont-la-Ville','Riaz','La Roche','Sâles','Sorens','Vaulruz','Vuadens','Bas-Intyamon','Val-de-Charmey','Arconciel','Autigny','Avry','Belfaux','Chénens','Corminboeuf','Cottens (FR)','Ependes (FR)','Ferpicloz','Fribourg','Givisiez','Granges-Paccot','Grolley','Marly','Matran','Neyruz (FR)','Pierrafortscha','Ponthaux','Le Mouret','Senèdes','Treyvaux','Villars-sur-Glâne','Villarsel-sur-Marly','Hauterive (FR)','La Brillaz','La Sonnaz','Gibloux','Prez','Courgevaux','Courtepin','Cressier (FR)','Fräschels','Galmiz','Gempenach','Greng','Gurmels','Kerzers','Kleinbösingen','Meyriez','Misery-Courtion','Muntelier','Murten','Ried bei Kerzers','Ulmiz','Mont-Vully','Alterswil','Brünisried','Düdingen','Giffers','Bösingen','Heitenried',
'Plaffeien','Plasselb','Rechthalten','St. Antoni','St. Silvester','St. Ursen','Schmitten (FR)','Tafers','Tentlingen','Ueberstorf','Wünnewil-Flamatt','Attalens','Bossonnens','Châtel-Saint-Denis','Granges (Veveyse)','Remaufens','Saint-Martin (FR)','Semsales','Le Flon','La Verrerie','Egerkingen','Härkingen','Kestenholz','Neuendorf','Niederbuchsiten','Oberbuchsiten','Oensingen','Wolfwil','Aedermannsdorf','Balsthal','Gänsbrunnen','Herbetswil','Holderbank (SO)','Laupersdorf','Matzendorf','Mümliswil-Ramiswil','Welschenrohr','Biezwil','Lüterkofen-Ichertswil','Lüterswil-Gächliwil','Messen','Schnottwil','Unterramsern','Lüsslingen-Nennigkofen','Buchegg','Bättwil','Büren (SO)','Dornach','Gempen','Hochwald','Hofstetten-Flüh','Metzerlen-Mariastein','Nuglar-St. Pantaleon','Rodersdorf','Seewen','Witterswil','Hauenstein-Ifenthal','Kienberg','Lostorf','Niedergösgen','Obergösgen','Rohr (SO)','Stüsslingen','Trimbach','Winznau','Wisen (SO)','Erlinsbach (SO)','Aeschi (SO)','Biberist','Bolken','Deitingen','Derendingen','Etziken','Gerlafingen','Halten','Horriwil','Hüniken','Kriegstetten','Lohn-Ammannsegg','Luterbach','Obergerlafingen','Oekingen','Recherswil','Subingen','Zuchwil','Drei Höfe','Balm bei Günsberg','Bellach','Bettlach','Feldbrunnen-St. Niklaus','Flumenthal','Grenchen','Günsberg','Hubersdorf','Kammersrohr','Langendorf','Lommiswil','Oberdorf (SO)','Riedholz','Rüttenen','Selzach','Boningen','Däniken','Dulliken','Eppenberg-Wöschnau','Fulenbach','Gretzenbach','Gunzgen','Hägendorf','Kappel (SO)','Olten','Rickenbach (SO)','Schönenwerd','Starrkirch-Wil','Walterswil (SO)','Wangen bei Olten','Solothurn','Bärschwil','Beinwil (SO)','Breitenbach','Büsserach','Erschwil','Fehren','Grindel','Himmelried','Kleinlützel','Meltingen','Nunningen','Zullwil','Basel','Bettingen','Riehen','Aesch (BL)','Allschwil','Arlesheim','Biel-Benken','Binningen','Birsfelden','Bottmingen','Ettingen','Münchenstein','Muttenz','Oberwil (BL)','Pfeffingen','Reinach (BL)','Schönenbuch','Therwil','Blauen','Brislach','Burg im Leimental','Dittingen','Duggingen','Grellingen','Laufen','Liesberg','Nenzlingen','Roggenburg','Röschenz','Wahlen','Zwingen','Arisdorf','Augst','Bubendorf','Frenkendorf','Füllinsdorf','Giebenach','Hersberg','Lausen','Liestal','Lupsingen','Pratteln','Ramlinsburg','Seltisberg','Ziefen','Anwil','Böckten','Buckten','Buus','Diepflingen','Gelterkinden','Häfelfingen','Hemmiken','Itingen','Känerkinden','Kilchberg (BL)','Läufelfingen','Maisprach','Nusshof','Oltingen','Ormalingen','Rickenbach (BL)','Rothenfluh','Rümlingen','Rünenberg','Sissach','Tecknau','Tenniken','Thürnen','Wenslingen','Wintersingen','Wittinsburg','Zeglingen','Zunzgen','Arboldswil','Bennwil','Bretzwil','Diegten','Eptingen','Hölstein','Lampenberg','Langenbruck','Lauwil','Liedertswil','Niederdorf','Oberdorf (BL)','Reigoldswil','Titterten','Waldenburg','Gächlingen','Löhningen','Neunkirch','Büttenhardt','Dörflingen','Lohn (SH)','Stetten (SH)','Thayngen','Bargen (SH)','Beringen','Buchberg','Merishausen','Neuhausen am Rheinfall','Rüdlingen','Schaffhausen','Beggingen','Schleitheim','Siblingen','Buch (SH)','Hemishofen','Ramsen','Stein am Rhein','Hallau','Oberhallau','Trasadingen','Wilchingen','Herisau','Hundwil','Schönengrund','Schwellbrunn','Stein (AR)','Urnäsch','Waldstatt','Bühler','Gais','Speicher','Teufen (AR)','Trogen','Grub (AR)','Heiden','Lutzenberg','Rehetobel','Reute (AR)','Wald (AR)','Walzenhausen','Wolfhalden','Appenzell','Gonten','Rüte','Schlatt-Haslen','Schwende','Oberegg','Häggenschwil','Muolen','St. Gallen','Wittenbach','Berg (SG)','Eggersriet','Goldach','Mörschwil','Rorschach','Rorschacherberg','Steinach','Tübach','Untereggen','Au (SG)','Balgach','Berneck','Diepoldsau','Rheineck','St. Margrethen','Thal','Widnau','Altstätten','Eichberg','Marbach (SG)','Oberriet (SG)','Rebstein','Rüthi (SG)','Buchs (SG)','Gams','Grabs','Sennwald','Sevelen','Wartau','Bad Ragaz','Flums','Mels','Pfäfers','Quarten','Sargans','Vilters-Wangs','Walenstadt','Amden','Benken (SG)','Kaltbrunn','Schänis','Weesen','Schmerikon','Uznach','Rapperswil-Jona','Gommiswald','Eschenbach (SG)','Ebnat-Kappel','Wildhaus-Alt St. Johann','Nesslau','Hemberg','Lichtensteig','Oberhelfenschwil','Neckertal','Wattwil','Kirchberg (SG)','Lütisburg','Mosnang','Bütschwil-Ganterschwil','Degersheim','Flawil','Jonschwil','Oberuzwil','Uzwil','Niederbüren','Niederhelfenschwil','Oberbüren','Zuzwil (SG)','Wil (SG)','Andwil (SG)','Gaiserwald','Gossau (SG)','Waldkirch','Vaz/Obervaz','Lantsch/Lenz','Schmitten (GR)','Albula/Alvra','Surses','Bergün Filisur','Brusio','Poschiavo','Falera','Laax','Sagogn','Schluein','Vals','Lumnezia','Ilanz/Glion','Fürstenau','Rothenbrunnen','Scharans','Sils im Domleschg','Cazis','Flerden','Masein','Thusis','Tschappina','Urmein','Safiental','Domleschg','Avers','Sufers','Andeer','Casti-Wergenstein','Donat','Lohn (GR)','Mathon','Rongellen','Zillis-Reischen','Ferrera','Rheinwald','Bonaduz','Domat/Ems','Rhäzüns','Felsberg','Flims','Tamins','Trin','Zernez','Samnaun','Scuol','Valsot','Bever','Celerina/Schlarigna','Madulain','Pontresina','La Punt-Chamues-ch','Samedan','St. Moritz','S-chanf','Sils im Engadin/Segl','Silvaplana','Zuoz','Bregaglia','Buseno','Castaneda','Rossa','Santa Maria in Calanca','Lostallo','Mesocco','Soazza','Cama','Grono','Roveredo (GR)','San Vittore','Calanca','Val Müstair','Davos','Fideris','Furna','Jenaz','Klosters-Serneus','Conters im Prättigau','Küblis','Luzein','Chur','Churwalden','Arosa','Tschiertschen-Praden','Haldenstein','Trimmis','Untervaz','Zizers','Fläsch','Jenins','Maienfeld','Malans','Landquart','Grüsch','Schiers','Seewis im Prättigau','Breil/Brigels','Disentis/Mustér','Medel (Lucmagn)','Sumvitg','Tujetsch','Trun','Obersaxen Mundaun','Aarau','Biberstein','Buchs (AG)','Densbüren','Erlinsbach (AG)','Gränichen','Hirschthal','Küttigen','Muhen','Oberentfelden','Suhr','Unterentfelden','Baden','Bellikon','Bergdietikon','Birmenstorf (AG)','Ennetbaden','Fislisbach','Freienwil','Gebenstorf','Killwangen','Künten','Mägenwil','Mellingen','Neuenhof','Niederrohrdorf','Oberrohrdorf','Obersiggenthal','Remetschwil','Spreitenbach','Stetten (AG)','Turgi','Untersiggenthal','Wettingen','Wohlenschwil','Würenlingen','Würenlos','Ehrendingen','Arni (AG)','Berikon','Bremgarten (AG)','Büttikon','Dottikon','Eggenwil','Fischbach-Göslikon','Hägglingen','Jonen','Niederwil (AG)','Oberlunkhofen','Oberwil-Lieli','Rudolfstetten-Friedlisberg','Sarmenstorf','Tägerig','Uezwil','Unterlunkhofen','Villmergen','Widen','Wohlen (AG)','Zufikon','Islisberg','Auenstein','Birr','Birrhard','Bözen','Brugg','Effingen','Elfingen','Habsburg','Hausen (AG)','Lupfig','Mandach','Mönthal','Mülligen','Remigen','Riniken','Rüfenach','Thalheim (AG)','Veltheim (AG)','Villigen','Villnachern','Windisch','Bözberg','Schinznach','Beinwil am See','Birrwil','Burg (AG)','Dürrenäsch','Gontenschwil','Holziken','Leimbach (AG)','Leutwil','Menziken','Oberkulm','Reinach (AG)','Schlossrued','Schmiedrued','Schöftland','Teufenthal (AG)','Unterkulm','Zetzwil','Eiken','Frick','Gansingen','Gipf-Oberfrick','Herznach','Hornussen','Kaisten','Laufenburg','Münchwilen (AG)','Oberhof','Oeschgen','Schwaderloch','Sisseln','Ueken','Wittnau','Wölflinswil','Zeihen','Mettauertal','Ammerswil','Boniswil','Brunegg','Dintikon','Egliswil','Fahrwangen','Hallwil','Hendschiken','Holderbank (AG)','Hunzenschwil','Lenzburg','Meisterschwanden','Möriken-Wildegg','Niederlenz','Othmarsingen','Rupperswil','Schafisheim','Seengen','Seon','Staufen','Abtwil','Aristau','Auw','Beinwil (Freiamt)','Besenbüren','Bettwil','Boswil','Bünzen','Buttwil','Dietwil','Geltwil','Kallern','Merenschwand','Mühlau','Muri (AG)','Oberrüti','Rottenschwil','Sins','Waltenschwil','Hellikon','Kaiseraugst','Magden','Möhlin','Mumpf','Obermumpf','Olsberg','Rheinfelden','Schupfart','Stein (AG)','Wallbach','Wegenstetten','Zeiningen','Zuzgen','Aarburg','Bottenwil','Brittnau','Kirchleerau','Kölliken','Moosleerau','Murgenthal','Oftringen','Reitnau','Rothrist','Safenwil','Staffelbach','Strengelbach','Uerkheim','Vordemwald','Wiliberg','Zofingen','Baldingen','Böbikon','Böttstein','Döttingen','Endingen','Fisibach','Full-Reuenthal','Kaiserstuhl','Klingnau','Koblenz','Leibstadt','Lengnau (AG)','Leuggern','Mellikon','Rekingen (AG)','Rietheim','Rümikon','Schneisingen','Siglistorf','Tegerfelden','Wislikofen','Bad Zurzach','Arbon','Dozwil','Egnach','Hefenhofen','Horn','Kesswil','Roggwil (TG)','Romanshorn','Salmsach','Sommeri','Uttwil','Amriswil','Bischofszell','Erlen','Hauptwil-Gottshaus','Hohentannen','Kradolf-Schönenberg','Sulgen','Zihlschlacht-Sitterdorf','Basadingen-Schlattingen','Diessenhofen','Schlatt (TG)','Aadorf','Felben-Wellhausen','Frauenfeld','Gachnang','Hüttlingen','Matzingen','Neunforn','Stettfurt','Thundorf','Uesslingen-Buch','Warth-Weiningen','Altnau','Bottighofen','Ermatingen','Gottlieben','Güttingen','Kemmental','Kreuzlingen','Langrickenbach','Lengwil','Münsterlingen','Tägerwilen','Wäldi','Affeltrangen','Bettwiesen','Bichelsee-Balterswil','Braunau','Eschlikon','Fischingen','Lommis','Münchwilen (TG)','Rickenbach (TG)','Schönholzerswilen','Sirnach','Tobel-Tägerschen','Wängi','Wilen (TG)','Wuppenau','Berlingen','Eschenz','Herdern','Homburg','Hüttwilen','Mammern','Müllheim','Pfyn','Raperswilen','Salenstein','Steckborn','Wagenhausen','Amlikon-Bissegg','Berg (TG)','Birwinken','Bürglen (TG)','Bussnang','Märstetten','Weinfelden','Wigoltingen','Arbedo-Castione','Bellinzona','Cadenazzo','Isone','Lumino','Sant&apos;Antonino','Acquarossa','Blenio','Serravalle','Airolo','Bedretto','Bodio','Dalpe','Faido','Giornico','Personico','Pollegio','Prato (Leventina)','Quinto','Ascona','Brione (Verzasca)','Brione sopra Minusio','Brissago','Corippo','Frasco','Gordola','Lavertezzo','Locarno','Losone','Mergoscia','Minusio','Muralto','Orselina','Ronco sopra Ascona','Sonogno','Tenero-Contra','Vogorno','Onsernone','Cugnasco-Gerra','Agno','Aranno','Arogno','Astano','Bedano','Bedigliora','Bioggio','Bissone','Brusino Arsizio','Cademario','Cadempino','Canobbio','Caslano','Comano','Croglio','Cureglia','Curio','Grancia','Gravesano','Lamone','Lugano',
'Magliaso','Manno','Maroggia','Massagno','Melano','Melide','Mezzovico-Vira','Miglieglia','Monteggio','Morcote','Muzzano','Neggio','Novaggio','Origlio','Paradiso','Ponte Capriasca','Ponte Tresa','Porza','Pura','Rovio','Savosa','Sessa','Sorengo','Capriasca','Torricella-Taverne','Vernate','Vezia','Vico Morcote','Collina d&apos;Oro','Alto Malcantone','Monteceneri','Balerna','Castel San Pietro','Chiasso','Coldrerio','Mendrisio','Morbio Inferiore','Novazzano','Riva San Vitale','Stabio','Vacallo','Breggia','Biasca','Riviera','Bosco/Gurin','Campo (Vallemaggia)','Cerentino','Cevio','Linescio','Maggia','Lavizzara','Avegno Gordevio','Terre di Pedemonte','Centovalli','Gambarogno','Aigle','Bex','Chessel','Corbeyrier','Gryon','Lavey-Morcles','Leysin','Noville','Ollon','Ormont-Dessous','Ormont-Dessus','Rennaz','Roche (VD)','Villeneuve (VD)','Yvorne','Apples','Aubonne','Ballens','Berolle','Bière','Bougy-Villars','Féchy','Gimel','Longirod','Marchissy','Mollens (VD)','Montherod','Saint-George','Saint-Livres','Saint-Oyens','Saubraz','Avenches','Cudrefin','Faoug','Vully-les-Lacs','Bettens','Bournens','Boussens','La Chaux (Cossonay)','Chavannes-le-Veyron','Chevilly','Cossonay','Cottens (VD)','Cuarnens','Daillens','Dizy','Eclépens','Ferreyres','Gollion','Grancy','L&apos;Isle','Lussery-Villars','Mauraz','Mex (VD)','Moiry','Mont-la-Ville','Montricher','Orny','Pampigny','Penthalaz','Penthaz','Pompaples','La Sarraz','Senarclens','Sévery','Sullens','Vufflens-la-Ville','Assens','Bercher','Bioley-Orjulaz','Bottens','Bretigny-sur-Morrens','Cugy (VD)','Echallens','Essertines-sur-Yverdon','Etagnières','Fey','Froideville','Morrens (VD)','Oulens-sous-Echallens','Pailly','Penthéréaz','Poliez-Pittet','Rueyres','Saint-Barthélemy (VD)','Villars-le-Terroir','Vuarrens','Montilliez','Goumoëns','Bonvillars','Bullet','Champagne','Concise','Corcelles-près-Concise','Fiez','Fontaines-sur-Grandson','Giez','Grandevent','Grandson','Mauborget','Mutrux','Novalles','Onnens (VD)','Provence','Sainte-Croix','Tévenon','Belmont-sur-Lausanne','Cheseaux-sur-Lausanne','Crissier','Epalinges','Jouxtens-Mézery','Lausanne','Le Mont-sur-Lausanne','Paudex','Prilly','Pully','Renens (VD)','Romanel-sur-Lausanne','Chexbres','Forel (Lavaux)','Lutry','Puidoux','Rivaz','Saint-Saphorin (Lavaux)','Savigny','Bourg-en-Lavaux','Aclens','Bremblens','Buchillon','Bussigny','Bussy-Chardonney','Chavannes-près-Renens','Chigny','Clarmont','Denens','Denges','Echandens','Echichens','Ecublens (VD)','Etoy','Lavigny','Lonay','Lully (VD)','Lussy-sur-Morges','Morges','Préverenges','Reverolle','Romanel-sur-Morges','Saint-Prex','Saint-Sulpice (VD)','Tolochenaz','Vaux-sur-Morges','Villars-Sainte-Croix','Villars-sous-Yens','Vufflens-le-Château','Vullierens','Yens','Boulens','Bussy-sur-Moudon','Chavannes-sur-Moudon','Curtilles','Dompierre (VD)','Hermenches','Lovatens','Lucens','Moudon','Ogens','Prévonloup','Rossenges','Syens','Villars-le-Comte','Vucherens','Montanaire','Arnex-sur-Nyon','Arzier-Le Muids','Bassins','Begnins','Bogis-Bossey','Borex','Chavannes-de-Bogis','Chavannes-des-Bois','Chéserex','Coinsins','Commugny','Coppet','Crans-près-Céligny','Crassier','Duillier','Eysins','Founex','Genolier','Gingins','Givrins','Gland','Grens','Mies','Nyon','Prangins','La Rippe','Saint-Cergue','Signy-Avenex','Tannay','Trélex','Le Vaud','Vich','L&apos;Abergement','Agiez','Arnex-sur-Orbe','Ballaigues','Baulmes','Bavois','Bofflens','Bretonnières','Chavornay','Les Clées','Croy','Juriens','Lignerolle','Montcherand','Orbe','La Praz','Premier','Rances','Romainmôtier-Envy','Sergey','Valeyres-sous-Rances','Vallorbe','Vaulion','Vuiteboeuf','Corcelles-le-Jorat','Essertes','Maracon','Montpreveyres','Ropraz','Servion','Vulliens','Jorat-Menthue','Oron','Jorat-Mézières','Champtauroz','Chevroux','Corcelles-près-Payerne','Grandcour','Henniez','Missy','Payerne','Trey','Treytorrens (Payerne)','Villarzel','Valbroye','Château-d&apos;Oex','Rossinière','Rougemont','Allaman','Bursinel','Bursins','Burtigny','Dully','Essertines-sur-Rolle','Gilly','Luins','Mont-sur-Rolle','Perroy','Rolle','Tartegnin','Vinzel','L&apos;Abbaye','Le Chenit','Le Lieu','Blonay','Chardonne','Corseaux','Corsier-sur-Vevey','Jongny','Montreux','Saint-Légier-La Chiésaz','La Tour-de-Peilz','Vevey','Veytaux','Belmont-sur-Yverdon','Bioley-Magnoux','Chamblon','Champvent','Chavannes-le-Chêne','Chêne-Pâquier','Cheseaux-Noréaz','Cronay','Cuarny','Démoret','Donneloye','Ependes (VD)','Mathod','Molondin','Montagny-près-Yverdon','Oppens','Orges','Orzens','Pomy','Rovray','Suchy','Suscévaz','Treycovagnes','Ursins','Valeyres-sous-Montagny','Valeyres-sous-Ursins','Villars-Epeney','Vugelles-La Mothe','Yverdon-les-Bains','Yvonand','Brig-Glis','Eggerberg','Naters','Ried-Brig','Simplon','Termen','Zwischbergen','Ardon','Chamoson','Conthey','Nendaz','Vétroz','Bagnes','Bourg-Saint-Pierre','Liddes','Orsières','Sembrancher','Vollèges','Bellwald','Binn','Ernen','Fiesch','Fieschertal','Lax','Obergoms','Goms','Ayent','Evolène','Hérémence','Saint-Martin (VS)','Vex','Mont-Noble','Agarn','Albinen','Ergisch','Inden','Leuk','Leukerbad','Oberems','Salgesch','Varen','Guttet-Feschel','Gampel-Bratsch','Turtmann-Unterems','Bovernier','Charrat','Fully','Isérables','Leytron','Martigny','Martigny-Combe','Riddes','Saillon','Saxon','Trient','Champéry','Collombey-Muraz','Monthey','Port-Valais','Saint-Gingolph','Troistorrents','Val-d&apos;Illiez','Vionnaz','Vouvry','Bister','Bitsch','Grengiols','Riederalp','Ausserberg','Blatten','Bürchen','Eischoll','Ferden','Kippel','Niedergesteln','Raron','Unterbäch','Wiler (Lötschen)','Mörel-Filet','Steg-Hohtenn','Bettmeralp','Collonges','Dorénaz','Evionnaz','Finhaut','Massongex','Saint-Maurice','Salvan','Vernayaz','Vérossaz','Chalais','Chippis','Grône','Icogne','Lens','Miège','Saint-Léonard','Sierre','Venthône','Veyras','Anniviers','Crans-Montana','Arbaz','Grimisuat','Savièse','Sion','Veysonnaz','Baltschieder','Eisten','Embd','Grächen','Lalden','Randa','Saas-Almagell','Saas-Balen','Saas-Fee','Saas-Grund','St. Niklaus','Stalden (VS)','Staldenried','Täsch','Törbel','Visp','Visperterminen','Zeneggen','Zermatt','Boudry','Corcelles-Cormondrèche','Cortaillod','Peseux','Rochefort','Milvignes','La Grande Béroche','La Chaux-de-Fonds','Les Planchettes','La Sagne','Les Brenets','La Brévine','Brot-Plamboz','Le Cerneux-Péquignot','La Chaux-du-Milieu','Le Locle','Les Ponts-de-Martel','Cornaux','Cressier (NE)','Enges','Hauterive (NE)','Le Landeron','Lignières','Neuchâtel','Saint-Blaise','La Tène','Valangin','Val-de-Ruz','La Côte-aux-Fées','Les Verrières','Val-de-Travers','Aire-la-Ville','Anières','Avully','Avusy','Bardonnex','Bellevue','Bernex','Carouge (GE)','Cartigny','Céligny','Chancy','Chêne-Bougeries','Chêne-Bourg','Choulex','Collex-Bossy','Collonge-Bellerive','Cologny','Confignon','Corsier (GE)','Dardagny','Genève','Genthod','Le Grand-Saconnex','Gy','Hermance','Jussy','Laconnex','Lancy','Meinier','Meyrin','Onex','Perly-Certoux','Plan-les-Ouates','Pregny-Chambésy','Presinge','Puplinge','Russin','Satigny','Soral','Thônex','Troinex','Vandoeuvres','Vernier','Versoix','Veyrier','Boécourt','Bourrignon','Châtillon (JU)','Courchapoix','Courrendlin','Courroux','Courtételle','Delémont','Develier','Ederswiler','Mervelier','Mettembert','Movelier','Pleigne','Rossemaison','Saulcy','Soyhières','Haute-Sorne','Val Terbi','Le Bémont (JU)','Les Bois','Les Breuleux','La Chaux-des-Breuleux','Les Enfers','Les Genevez (JU)','Lajoux (JU)','Montfaucon','Muriaux','Le Noirmont','Saignelégier','Saint-Brais','Soubey','Alle','Beurnevésin','Boncourt','Bonfol','Bure','Coeuve','Cornol','Courchavon','Courgenay','Courtedoux','Damphreux','Fahy','Fontenais','Grandfontaine','Lugnez','Porrentruy','Vendlincourt','Basse-Allaine','Clos du Doubs','Haute-Ajoie','La Baroche',
];

  public GemeindenKoordinaten = [
    [
      {
        "Gemeinde": "Aeugst am Albis",
        "Longitude": 8.48653820616402,
        "Latitude": 47.2674401876416
      },
      {
        "Gemeinde": "Affoltern am Albis",
        "Longitude": 8.45369352617591,
        "Latitude": 47.2776290199677
      },
      {
        "Gemeinde": "Bonstetten",
        "Longitude": 8.46763718936309,
        "Latitude": 47.3152848954632
      },
      {
        "Gemeinde": "Hausen am Albis",
        "Longitude": 8.53362426233443,
        "Latitude": 47.2436148878498
      },
      {
        "Gemeinde": "Hedingen",
        "Longitude": 8.4487819364301,
        "Latitude": 47.2974614701693
      },
      {
        "Gemeinde": "Kappel am Albis",
        "Longitude": 8.5266909507031,
        "Latitude": 47.2274885778517
      },
      {
        "Gemeinde": "Knonau",
        "Longitude": 8.46192743127836,
        "Latitude": 47.2244837873626
      },
      {
        "Gemeinde": "Maschwanden",
        "Longitude": 8.42646392643024,
        "Latitude": 47.234688359107
      },
      {
        "Gemeinde": "Mettmenstetten",
        "Longitude": 8.463609969443,
        "Latitude": 47.2433591178411
      },
      {
        "Gemeinde": "Obfelden",
        "Longitude": 8.43097670650824,
        "Latitude": 47.2643339841321
      },
      {
        "Gemeinde": "Ottenbach",
        "Longitude": 8.40353986179879,
        "Latitude": 47.2816579393779
      },
      {
        "Gemeinde": "Rifferswil",
        "Longitude": 8.49659174785578,
        "Latitude": 47.2412620007407
      },
      {
        "Gemeinde": "Stallikon",
        "Longitude": 8.49031380133293,
        "Latitude": 47.3249753327314
      },
      {
        "Gemeinde": "Wettswil am Albis",
        "Longitude": 8.47339774864607,
        "Latitude": 47.3395206314021
      },
      {
        "Gemeinde": "Adlikon",
        "Longitude": 8.6921774077671,
        "Latitude": 47.5829192846573
      },
      {
        "Gemeinde": "Benken (ZH)",
        "Longitude": 8.65391157767211,
        "Latitude": 47.6534839689142
      },
      {
        "Gemeinde": "Berg am Irchel",
        "Longitude": 8.5974974429189,
        "Latitude": 47.5695135817131
      },
      {
        "Gemeinde": "Buch am Irchel",
        "Longitude": 8.62226239469571,
        "Latitude": 47.5476757275079
      },
      {
        "Gemeinde": "Dachsen",
        "Longitude": 8.61821813448487,
        "Latitude": 47.6646451324245
      },
      {
        "Gemeinde": "Dorf",
        "Longitude": 8.64807171532871,
        "Latitude": 47.5725943534404
      },
      {
        "Gemeinde": "Feuerthalen",
        "Longitude": 8.64279156196124,
        "Latitude": 47.6913755021899
      },
      {
        "Gemeinde": "Flaach",
        "Longitude": 8.60826617032655,
        "Latitude": 47.5757015399896
      },
      {
        "Gemeinde": "Flurlingen",
        "Longitude": 8.62927127997292,
        "Latitude": 47.682520623631
      },
      {
        "Gemeinde": "Andelfingen",
        "Longitude": 8.67913894203026,
        "Latitude": 47.593853245376
      },
      {
        "Gemeinde": "Henggart",
        "Longitude": 8.6823890838899,
        "Latitude": 47.5623367137081
      },
      {
        "Gemeinde": "Humlikon",
        "Longitude": 8.67076608565028,
        "Latitude": 47.5768525531221
      },
      {
        "Gemeinde": "Kleinandelfingen",
        "Longitude": 8.6832535825767,
        "Latitude": 47.5992059025146
      },
      {
        "Gemeinde": "Laufen-Uhwiesen",
        "Longitude": 8.63431362916005,
        "Latitude": 47.6698769971732
      },
      {
        "Gemeinde": "Marthalen",
        "Longitude": 8.64795204487596,
        "Latitude": 47.6256634912191
      },
      {
        "Gemeinde": "Ossingen",
        "Longitude": 8.72610254061459,
        "Latitude": 47.6113304841213
      },
      {
        "Gemeinde": "Rheinau",
        "Longitude": 8.6057824039826,
        "Latitude": 47.6440843014041
      },
      {
        "Gemeinde": "Thalheim an der Thur",
        "Longitude": 8.75455379338556,
        "Latitude": 47.5786297090421
      },
      {
        "Gemeinde": "Trüllikon",
        "Longitude": 8.69347492261593,
        "Latitude": 47.6377722561663
      },
      {
        "Gemeinde": "Truttikon",
        "Longitude": 8.72653938847288,
        "Latitude": 47.6293148777365
      },
      {
        "Gemeinde": "Volken",
        "Longitude": 8.62552182259682,
        "Latitude": 47.5746265248212
      },
      {
        "Gemeinde": "Bachenbülach",
        "Longitude": 8.54826962075467,
        "Latitude": 47.5034350998162
      },
      {
        "Gemeinde": "Bassersdorf",
        "Longitude": 8.62924015241459,
        "Latitude": 47.4441620041098
      },
      {
        "Gemeinde": "Bülach",
        "Longitude": 8.54062391285968,
        "Latitude": 47.5187993112007
      },
      {
        "Gemeinde": "Dietlikon",
        "Longitude": 8.61821640024281,
        "Latitude": 47.4253854557095
      },
      {
        "Gemeinde": "Eglisau",
        "Longitude": 8.52317708799853,
        "Latitude": 47.5747303068164
      },
      {
        "Gemeinde": "Embrach",
        "Longitude": 8.59471868893311,
        "Latitude": 47.5029801434851
      },
      {
        "Gemeinde": "Freienstein-Teufen",
        "Longitude": 8.58470340947087,
        "Latitude": 47.53096368453
      },
      {
        "Gemeinde": "Glattfelden",
        "Longitude": 8.50157211212852,
        "Latitude": 47.5578412264442
      },
      {
        "Gemeinde": "Hochfelden",
        "Longitude": 8.51680149009409,
        "Latitude": 47.5226214355576
      },
      {
        "Gemeinde": "Höri",
        "Longitude": 8.50852769038761,
        "Latitude": 47.5074070763668
      },
      {
        "Gemeinde": "Hüntwangen",
        "Longitude": 8.49169296796925,
        "Latitude": 47.5957075961326
      },
      {
        "Gemeinde": "Kloten",
        "Longitude": 8.58299745920406,
        "Latitude": 47.4518249704941
      },
      {
        "Gemeinde": "Lufingen",
        "Longitude": 8.59575189069161,
        "Latitude": 47.4894774094701
      },
      {
        "Gemeinde": "Nürensdorf",
        "Longitude": 8.64918625141762,
        "Latitude": 47.4466535530367
      },
      {
        "Gemeinde": "Oberembrach",
        "Longitude": 8.6182665859061,
        "Latitude": 47.4874512792226
      },
      {
        "Gemeinde": "Opfikon",
        "Longitude": 8.57727053104576,
        "Latitude": 47.4320924624563
      },
      {
        "Gemeinde": "Rafz",
        "Longitude": 8.53724840885999,
        "Latitude": 47.6123743433403
      },
      {
        "Gemeinde": "Rorbas",
        "Longitude": 8.57667874819874,
        "Latitude": 47.5283445874716
      },
      {
        "Gemeinde": "Wallisellen",
        "Longitude": 8.59412896669635,
        "Latitude": 47.4148345860589
      },
      {
        "Gemeinde": "Wasterkingen",
        "Longitude": 8.47297513616069,
        "Latitude": 47.5904793463109
      },
      {
        "Gemeinde": "Wil (ZH)",
        "Longitude": 8.50784606837928,
        "Latitude": 47.6054536807588
      },
      {
        "Gemeinde": "Winkel",
        "Longitude": 8.55600546663908,
        "Latitude": 47.4925666050982
      },
      {
        "Gemeinde": "Bachs",
        "Longitude": 8.43983203345976,
        "Latitude": 47.5251111611117
      },
      {
        "Gemeinde": "Boppelsen",
        "Longitude": 8.40166144688322,
        "Latitude": 47.4705677309298
      },
      {
        "Gemeinde": "Buchs (ZH)",
        "Longitude": 8.43856225560181,
        "Latitude": 47.4576621041725
      },
      {
        "Gemeinde": "Dällikon",
        "Longitude": 8.43822442490555,
        "Latitude": 47.4396753575945
      },
      {
        "Gemeinde": "Dänikon",
        "Longitude": 8.40518282768205,
        "Latitude": 47.4453532285679
      },
      {
        "Gemeinde": "Dielsdorf",
        "Longitude": 8.45362892041976,
        "Latitude": 47.48271626918
      },
      {
        "Gemeinde": "Hüttikon",
        "Longitude": 8.3866227735201,
        "Latitude": 47.4455068797413
      },
      {
        "Gemeinde": "Neerach",
        "Longitude": 8.47412402740002,
        "Latitude": 47.5131167423185
      },
      {
        "Gemeinde": "Niederglatt",
        "Longitude": 8.50422111381615,
        "Latitude": 47.4912562086557
      },
      {
        "Gemeinde": "Niederhasli",
        "Longitude": 8.48545041421802,
        "Latitude": 47.4815332505085
      },
      {
        "Gemeinde": "Niederweningen",
        "Longitude": 8.3770633806009,
        "Latitude": 47.5049495011264
      },
      {
        "Gemeinde": "Oberglatt",
        "Longitude": 8.51985038207952,
        "Latitude": 47.4767194105871
      },
      {
        "Gemeinde": "Oberweningen",
        "Longitude": 8.40621306255979,
        "Latitude": 47.5020111087783
      },
      {
        "Gemeinde": "Otelfingen",
        "Longitude": 8.38691124171285,
        "Latitude": 47.461695019857
      },
      {
        "Gemeinde": "Regensberg",
        "Longitude": 8.43903579915726,
        "Latitude": 47.4828433017713
      },
      {
        "Gemeinde": "Regensdorf",
        "Longitude": 8.46588748360015,
        "Latitude": 47.430437878086
      },
      {
        "Gemeinde": "Rümlang",
        "Longitude": 8.53127099937372,
        "Latitude": 47.4514261209153
      },
      {
        "Gemeinde": "Schleinikon",
        "Longitude": 8.39551498580777,
        "Latitude": 47.497602710694
      },
      {
        "Gemeinde": "Schöfflisdorf",
        "Longitude": 8.41679704539767,
        "Latitude": 47.5001232367152
      },
      {
        "Gemeinde": "Stadel",
        "Longitude": 8.46778303885629,
        "Latitude": 47.5284643092831
      },
      {
        "Gemeinde": "Steinmaur",
        "Longitude": 8.45528217813604,
        "Latitude": 47.4997916956335
      },
      {
        "Gemeinde": "Weiach",
        "Longitude": 8.43776867014145,
        "Latitude": 47.5566098936459
      },
      {
        "Gemeinde": "Bäretswil",
        "Longitude": 8.85708405320077,
        "Latitude": 47.3363421444689
      },
      {
        "Gemeinde": "Bubikon",
        "Longitude": 8.81829809045298,
        "Latitude": 47.2693436871833
      },
      {
        "Gemeinde": "Dürnten",
        "Longitude": 8.84229317133107,
        "Latitude": 47.2771502678885
      },
      {
        "Gemeinde": "Fischenthal",
        "Longitude": 8.9218041206673,
        "Latitude": 47.3319299890445
      },
      {
        "Gemeinde": "Gossau (ZH)",
        "Longitude": 8.75578751189356,
        "Latitude": 47.3069575191115
      },
      {
        "Gemeinde": "Grüningen",
        "Longitude": 8.76316248302384,
        "Latitude": 47.2843837708885
      },
      {
        "Gemeinde": "Hinwil",
        "Longitude": 8.84555205113839,
        "Latitude": 47.3004998275713
      },
      {
        "Gemeinde": "Rüti (ZH)",
        "Longitude": 8.85241171037233,
        "Latitude": 47.2599341831324
      },
      {
        "Gemeinde": "Seegräben",
        "Longitude": 8.77253081350302,
        "Latitude": 47.3418480111873
      },
      {
        "Gemeinde": "Wald (ZH)",
        "Longitude": 8.9149700637041,
        "Latitude": 47.2762424012502
      },
      {
        "Gemeinde": "Wetzikon (ZH)",
        "Longitude": 8.7971645522473,
        "Latitude": 47.3217703111093
      },
      {
        "Gemeinde": "Adliswil",
        "Longitude": 8.52577062642887,
        "Latitude": 47.3120534962666
      },
      {
        "Gemeinde": "Kilchberg (ZH)",
        "Longitude": 8.54175053791105,
        "Latitude": 47.3172991221795
      },
      {
        "Gemeinde": "Langnau am Albis",
        "Longitude": 8.54115570658279,
        "Latitude": 47.288519936245
      },
      {
        "Gemeinde": "Oberrieden",
        "Longitude": 8.57923765558788,
        "Latitude": 47.2764557281276
      },
      {
        "Gemeinde": "Richterswil",
        "Longitude": 8.70581716197069,
        "Latitude": 47.2076650877418
      },
      {
        "Gemeinde": "Rüschlikon",
        "Longitude": 8.55480618634082,
        "Latitude": 47.3090778959494
      },
      {
        "Gemeinde": "Thalwil",
        "Longitude": 8.56895129204549,
        "Latitude": 47.2900501147513
      },
      {
        "Gemeinde": "Erlenbach (ZH)",
        "Longitude": 8.59171345549095,
        "Latitude": 47.3033174431726
      },
      {
        "Gemeinde": "Herrliberg",
        "Longitude": 8.61113035029154,
        "Latitude": 47.2842311924374
      },
      {
        "Gemeinde": "Hombrechtikon",
        "Longitude": 8.76632178348191,
        "Latitude": 47.2519625650969
      },
      {
        "Gemeinde": "Küsnacht (ZH)",
        "Longitude": 8.58407005404358,
        "Latitude": 47.3168867172432
      },
      {
        "Gemeinde": "Männedorf",
        "Longitude": 8.69633873186278,
        "Latitude": 47.2536474175343
      },
      {
        "Gemeinde": "Meilen",
        "Longitude": 8.64516851507795,
        "Latitude": 47.2694872372716
      },
      {
        "Gemeinde": "Oetwil am See",
        "Longitude": 8.72052448356735,
        "Latitude": 47.270472804803
      },
      {
        "Gemeinde": "Stäfa",
        "Longitude": 8.71981241270217,
        "Latitude": 47.2407947163298
      },
      {
        "Gemeinde": "Uetikon am See",
        "Longitude": 8.67805473052238,
        "Latitude": 47.2628412938999
      },
      {
        "Gemeinde": "Zumikon",
        "Longitude": 8.62538689679552,
        "Latitude": 47.3308616549743
      },
      {
        "Gemeinde": "Zollikon",
        "Longitude": 8.57396896393693,
        "Latitude": 47.3394747046613
      },
      {
        "Gemeinde": "Fehraltorf",
        "Longitude": 8.75249181550764,
        "Latitude": 47.3879555462878
      },
      {
        "Gemeinde": "Hittnau",
        "Longitude": 8.82606008841146,
        "Latitude": 47.3646061180595
      },
      {
        "Gemeinde": "Lindau",
        "Longitude": 8.67161864169623,
        "Latitude": 47.4419190430779
      },
      {
        "Gemeinde": "Pfäffikon",
        "Longitude": 8.78502852109046,
        "Latitude": 47.3650918059088
      },
      {
        "Gemeinde": "Russikon",
        "Longitude": 8.77650794957183,
        "Latitude": 47.3948762120457
      },
      {
        "Gemeinde": "Weisslingen",
        "Longitude": 8.76418179151428,
        "Latitude": 47.431899557793
      },
      {
        "Gemeinde": "Wila",
        "Longitude": 8.84606283004612,
        "Latitude": 47.4201370084153
      },
      {
        "Gemeinde": "Wildberg",
        "Longitude": 8.81707631296425,
        "Latitude": 47.4267831861995
      },
      {
        "Gemeinde": "Dübendorf",
        "Longitude": 8.62159214006724,
        "Latitude": 47.3983655416381
      },
      {
        "Gemeinde": "Egg",
        "Longitude": 8.69083042541877,
        "Latitude": 47.300484681324
      },
      {
        "Gemeinde": "Fällanden",
        "Longitude": 8.63950627746904,
        "Latitude": 47.370295440033
      },
      {
        "Gemeinde": "Greifensee",
        "Longitude": 8.67779161751569,
        "Latitude": 47.3653931599046
      },
      {
        "Gemeinde": "Maur",
        "Longitude": 8.6692678195739,
        "Latitude": 47.3402969855223
      },
      {
        "Gemeinde": "Mönchaltorf",
        "Longitude": 8.72147513235208,
        "Latitude": 47.3100429931252
      },
      {
        "Gemeinde": "Schwerzenbach",
        "Longitude": 8.65967240331351,
        "Latitude": 47.3835770242886
      },
      {
        "Gemeinde": "Uster",
        "Longitude": 8.71843613054082,
        "Latitude": 47.348757678505
      },
      {
        "Gemeinde": "Volketswil",
        "Longitude": 8.69424769689062,
        "Latitude": 47.389502918062
      },
      {
        "Gemeinde": "Wangen-Brüttisellen",
        "Longitude": 8.64571838857062,
        "Latitude": 47.41070915778
      },
      {
        "Gemeinde": "Altikon",
        "Longitude": 8.78099626026455,
        "Latitude": 47.5729293533627
      },
      {
        "Gemeinde": "Brütten",
        "Longitude": 8.67365387499155,
        "Latitude": 47.4724808818393
      },
      {
        "Gemeinde": "Dägerlen",
        "Longitude": 8.72222382247104,
        "Latitude": 47.5610026762479
      },
      {
        "Gemeinde": "Dättlikon",
        "Longitude": 8.62437642274091,
        "Latitude": 47.5233682102896
      },
      {
        "Gemeinde": "Dinhard",
        "Longitude": 8.7672577581027,
        "Latitude": 47.5550977302617
      },
      {
        "Gemeinde": "Ellikon an der Thur",
        "Longitude": 8.82461163193183,
        "Latitude": 47.56342072994
      },
      {
        "Gemeinde": "Elsau",
        "Longitude": 8.801853190006,
        "Latitude": 47.505222937554
      },
      {
        "Gemeinde": "Hagenbuch",
        "Longitude": 8.88857940080451,
        "Latitude": 47.521259672155
      },
      {
        "Gemeinde": "Hettlingen",
        "Longitude": 8.70724470018559,
        "Latitude": 47.5458764186966
      },
      {
        "Gemeinde": "Neftenbach",
        "Longitude": 8.66698425218205,
        "Latitude": 47.5283207779646
      },
      {
        "Gemeinde": "Pfungen",
        "Longitude": 8.64012473998071,
        "Latitude": 47.5151104980811
      },
      {
        "Gemeinde": "Rickenbach (ZH)",
        "Longitude": 8.79641269157811,
        "Latitude": 47.5520610349516
      },
      {
        "Gemeinde": "Schlatt (ZH)",
        "Longitude": 8.82743178239411,
        "Latitude": 47.4680381557233
      },
      {
        "Gemeinde": "Seuzach",
        "Longitude": 8.73223821839918,
        "Latitude": 47.5357054398688
      },
      {
        "Gemeinde": "Turbenthal",
        "Longitude": 8.84518945810545,
        "Latitude": 47.4372390767832
      },
      {
        "Gemeinde": "Winterthur",
        "Longitude": 8.72868671495898,
        "Latitude": 47.4988656067021
      },
      {
        "Gemeinde": "Zell (ZH)",
        "Longitude": 8.77539387266739,
        "Latitude": 47.4560581397732
      },
      {
        "Gemeinde": "Aesch (ZH)",
        "Longitude": 8.43760754926086,
        "Latitude": 47.3362380387869
      },
      {
        "Gemeinde": "Birmensdorf (ZH)",
        "Longitude": 8.43796157651306,
        "Latitude": 47.3551247120847
      },
      {
        "Gemeinde": "Dietikon",
        "Longitude": 8.39916543562211,
        "Latitude": 47.4058262285803
      },
      {
        "Gemeinde": "Geroldswil",
        "Longitude": 8.41135092231951,
        "Latitude": 47.4201160319607
      },
      {
        "Gemeinde": "Oberengstringen",
        "Longitude": 8.4628213403113,
        "Latitude": 47.4088771519627
      },
      {
        "Gemeinde": "Oetwil an der Limmat",
        "Longitude": 8.39559506196328,
        "Latitude": 47.4283430934347
      },
      {
        "Gemeinde": "Schlieren",
        "Longitude": 8.44800986003442,
        "Latitude": 47.3964145615287
      },
      {
        "Gemeinde": "Uitikon",
        "Longitude": 8.45282800183124,
        "Latitude": 47.3711859556622
      },
      {
        "Gemeinde": "Unterengstringen",
        "Longitude": 8.44960764869543,
        "Latitude": 47.4107925619723
      },
      {
        "Gemeinde": "Urdorf",
        "Longitude": 8.42390301264273,
        "Latitude": 47.3822304973118
      },
      {
        "Gemeinde": "Weiningen (ZH)",
        "Longitude": 8.43520263455849,
        "Latitude": 47.4199126243348
      },
      {
        "Gemeinde": "Zürich",
        "Longitude": 8.53885902326617,
        "Latitude": 47.3694989732376
      },
      {
        "Gemeinde": "Stammheim",
        "Longitude": 8.80109990218989,
        "Latitude": 47.6311612902213
      },
      {
        "Gemeinde": "Wädenswil",
        "Longitude": 8.67198112468619,
        "Latitude": 47.2287227818848
      },
      {
        "Gemeinde": "Elgg",
        "Longitude": 8.86782063713738,
        "Latitude": 47.4900344776986
      },
      {
        "Gemeinde": "Horgen",
        "Longitude": 8.59868867717925,
        "Latitude": 47.2591702424384
      },
      {
        "Gemeinde": "Illnau-Effretikon",
        "Longitude": 8.68718767395811,
        "Latitude": 47.4273596965629
      },
      {
        "Gemeinde": "Bauma",
        "Longitude": 8.87777640754917,
        "Latitude": 47.3675716938246
      },
      {
        "Gemeinde": "Wiesendangen",
        "Longitude": 8.78899335854858,
        "Latitude": 47.5215647865097
      },
      {
        "Gemeinde": "Aarberg",
        "Longitude": 7.27808969081057,
        "Latitude": 47.0454204917771
      },
      {
        "Gemeinde": "Bargen (BE)",
        "Longitude": 7.2623222615491,
        "Latitude": 47.0382013400341
      },
      {
        "Gemeinde": "Grossaffoltern",
        "Longitude": 7.36096301561436,
        "Latitude": 47.0661953806038
      },
      {
        "Gemeinde": "Kallnach",
        "Longitude": 7.23607562217484,
        "Latitude": 47.0201672585229
      },
      {
        "Gemeinde": "Kappelen",
        "Longitude": 7.26751628321921,
        "Latitude": 47.0597975660069
      },
      {
        "Gemeinde": "Lyss",
        "Longitude": 7.30696924831274,
        "Latitude": 47.0742418112603
      },
      {
        "Gemeinde": "Meikirch",
        "Longitude": 7.3636756910751,
        "Latitude": 47.0095275997899
      },
      {
        "Gemeinde": "Radelfingen",
        "Longitude": 7.27290131143832,
        "Latitude": 47.0211262300114
      },
      {
        "Gemeinde": "Rapperswil (BE)",
        "Longitude": 7.4109888557031,
        "Latitude": 47.0635194959866
      },
      {
        "Gemeinde": "Schüpfen",
        "Longitude": 7.37810842560113,
        "Latitude": 47.0383207735361
      },
      {
        "Gemeinde": "Seedorf (BE)",
        "Longitude": 7.31232780579313,
        "Latitude": 47.0355685111983
      },
      {
        "Gemeinde": "Aarwangen",
        "Longitude": 7.77013685023109,
        "Latitude": 47.2402462638646
      },
      {
        "Gemeinde": "Auswil",
        "Longitude": 7.83539208713498,
        "Latitude": 47.1347999395622
      },
      {
        "Gemeinde": "Bannwil",
        "Longitude": 7.73577794605575,
        "Latitude": 47.2367419774995
      },
      {
        "Gemeinde": "Bleienbach",
        "Longitude": 7.75659790087475,
        "Latitude": 47.1845168780171
      },
      {
        "Gemeinde": "Busswil bei Melchnau",
        "Longitude": 7.82784894156303,
        "Latitude": 47.18519741751
      },
      {
        "Gemeinde": "Gondiswil",
        "Longitude": 7.87239417412479,
        "Latitude": 47.1463600727432
      },
      {
        "Gemeinde": "Langenthal",
        "Longitude": 7.78712453005868,
        "Latitude": 47.212312467836
      },
      {
        "Gemeinde": "Lotzwil",
        "Longitude": 7.79094216727733,
        "Latitude": 47.1907130785094
      },
      {
        "Gemeinde": "Madiswil",
        "Longitude": 7.79869019967587,
        "Latitude": 47.1655034892373
      },
      {
        "Gemeinde": "Melchnau",
        "Longitude": 7.8515767857439,
        "Latitude": 47.1824163437768
      },
      {
        "Gemeinde": "Obersteckholz",
        "Longitude": 7.82003525748755,
        "Latitude": 47.1996153857967
      },
      {
        "Gemeinde": "Oeschenbach",
        "Longitude": 7.74688660533948,
        "Latitude": 47.1017899483579
      },
      {
        "Gemeinde": "Reisiswil",
        "Longitude": 7.8435318212681,
        "Latitude": 47.1653545153213
      },
      {
        "Gemeinde": "Roggwil (BE)",
        "Longitude": 7.82164430600236,
        "Latitude": 47.2400870978248
      },
      {
        "Gemeinde": "Rohrbach",
        "Longitude": 7.81562665425684,
        "Latitude": 47.1357658531167
      },
      {
        "Gemeinde": "Rohrbachgraben",
        "Longitude": 7.79697420838195,
        "Latitude": 47.1061418978254
      },
      {
        "Gemeinde": "Rütschelen",
        "Longitude": 7.77500691289887,
        "Latitude": 47.174570127173
      },
      {
        "Gemeinde": "Schwarzhäusern",
        "Longitude": 7.76756721118232,
        "Latitude": 47.2519468178015
      },
      {
        "Gemeinde": "Thunstetten",
        "Longitude": 7.74489388611405,
        "Latitude": 47.2142312238651
      },
      {
        "Gemeinde": "Ursenbach",
        "Longitude": 7.7721335924662,
        "Latitude": 47.1367995938453
      },
      {
        "Gemeinde": "Wynau",
        "Longitude": 7.81781582219345,
        "Latitude": 47.2589886369593
      },
      {
        "Gemeinde": "Bern",
        "Longitude": 7.4399470245359,
        "Latitude": 46.9483847855435
      },
      {
        "Gemeinde": "Bolligen",
        "Longitude": 7.49514332777144,
        "Latitude": 46.9744571722274
      },
      {
        "Gemeinde": "Bremgarten bei Bern",
        "Longitude": 7.43863352186326,
        "Latitude": 46.9789686322913
      },
      {
        "Gemeinde": "Kirchlindach",
        "Longitude": 7.41496697345627,
        "Latitude": 47.0005542310005
      },
      {
        "Gemeinde": "Köniz",
        "Longitude": 7.4163125651965,
        "Latitude": 46.9258943001962
      },
      {
        "Gemeinde": "Muri bei Bern",
        "Longitude": 7.48721884804913,
        "Latitude": 46.9303839715541
      },
      {
        "Gemeinde": "Oberbalm",
        "Longitude": 7.40452960548717,
        "Latitude": 46.8737185078541
      },
      {
        "Gemeinde": "Stettlen",
        "Longitude": 7.52403167656298,
        "Latitude": 46.9591474969178
      },
      {
        "Gemeinde": "Vechigen",
        "Longitude": 7.56078806191299,
        "Latitude": 46.9456215260749
      },
      {
        "Gemeinde": "Wohlen bei Bern",
        "Longitude": 7.3584697095019,
        "Latitude": 46.9735428312114
      },
      {
        "Gemeinde": "Zollikofen",
        "Longitude": 7.45441027390991,
        "Latitude": 46.9987569283404
      },
      {
        "Gemeinde": "Ittigen",
        "Longitude": 7.47937347260428,
        "Latitude": 46.9753634374169
      },
      {
        "Gemeinde": "Ostermundigen",
        "Longitude": 7.4859283037467,
        "Latitude": 46.9564708688306
      },
      {
        "Gemeinde": "Biel/Bienne",
        "Longitude": 7.24747927544683,
        "Latitude": 47.1416208611945
      },
      {
        "Gemeinde": "Evilard",
        "Longitude": 7.24086095983182,
        "Latitude": 47.1488054963526
      },
      {
        "Gemeinde": "Arch",
        "Longitude": 7.42940051734335,
        "Latitude": 47.1660666308984
      },
      {
        "Gemeinde": "Büetigen",
        "Longitude": 7.3424622732588,
        "Latitude": 47.1057597940743
      },
      {
        "Gemeinde": "Büren an der Aare",
        "Longitude": 7.37272142019564,
        "Latitude": 47.139062471467
      },
      {
        "Gemeinde": "Diessbach bei Büren",
        "Longitude": 7.36221957465715,
        "Latitude": 47.1084731944312
      },
      {
        "Gemeinde": "Dotzigen",
        "Longitude": 7.34111834222321,
        "Latitude": 47.1201507279038
      },
      {
        "Gemeinde": "Lengnau (BE)",
        "Longitude": 7.36607155816711,
        "Latitude": 47.1822339250222
      },
      {
        "Gemeinde": "Leuzigen",
        "Longitude": 7.45709982763413,
        "Latitude": 47.1741607205343
      },
      {
        "Gemeinde": "Meienried",
        "Longitude": 7.3384474487383,
        "Latitude": 47.1390374758725
      },
      {
        "Gemeinde": "Meinisberg",
        "Longitude": 7.34895863240677,
        "Latitude": 47.1597347569736
      },
      {
        "Gemeinde": "Oberwil bei Büren",
        "Longitude": 7.40568435191167,
        "Latitude": 47.1282829296355
      },
      {
        "Gemeinde": "Pieterlen",
        "Longitude": 7.33706068925585,
        "Latitude": 47.1750162034596
      },
      {
        "Gemeinde": "Rüti bei Büren",
        "Longitude": 7.4056696202618,
        "Latitude": 47.1516699618337
      },
      {
        "Gemeinde": "Wengi",
        "Longitude": 7.40044410889913,
        "Latitude": 47.0824060163443
      },
      {
        "Gemeinde": "Aefligen",
        "Longitude": 7.55717603120358,
        "Latitude": 47.0949460248498
      },
      {
        "Gemeinde": "Alchenstorf",
        "Longitude": 7.64290056408759,
        "Latitude": 47.1236091872891
      },
      {
        "Gemeinde": "Bäriswil",
        "Longitude": 7.52675742968239,
        "Latitude": 47.0194136010952
      },
      {
        "Gemeinde": "Burgdorf",
        "Longitude": 7.62290113392125,
        "Latitude": 47.0561800689435
      },
      {
        "Gemeinde": "Ersigen",
        "Longitude": 7.59669071833864,
        "Latitude": 47.0948982693983
      },
      {
        "Gemeinde": "Hasle bei Burgdorf",
        "Longitude": 7.65564594330995,
        "Latitude": 47.016543977839
      },
      {
        "Gemeinde": "Heimiswil",
        "Longitude": 7.65979129337595,
        "Latitude": 47.0651101281985
      },
      {
        "Gemeinde": "Hellsau",
        "Longitude": 7.64825969639775,
        "Latitude": 47.1460868819096
      },
      {
        "Gemeinde": "Hindelbank",
        "Longitude": 7.54126881297261,
        "Latitude": 47.0418897662592
      },
      {
        "Gemeinde": "Höchstetten",
        "Longitude": 7.63242574517098,
        "Latitude": 47.1425165940817
      },
      {
        "Gemeinde": "Kernenried",
        "Longitude": 7.54658663521904,
        "Latitude": 47.0688706023402
      },
      {
        "Gemeinde": "Kirchberg (BE)",
        "Longitude": 7.58349008940937,
        "Latitude": 47.0841216903019
      },
      {
        "Gemeinde": "Koppigen",
        "Longitude": 7.6033924120594,
        "Latitude": 47.1326676416465
      },
      {
        "Gemeinde": "Krauchthal",
        "Longitude": 7.56619315366188,
        "Latitude": 47.0094819949794
      },
      {
        "Gemeinde": "Lyssach",
        "Longitude": 7.57817831108576,
        "Latitude": 47.0670374354294
      },
      {
        "Gemeinde": "Mötschwil",
        "Longitude": 7.56892146026329,
        "Latitude": 47.0499574386488
      },
      {
        "Gemeinde": "Oberburg",
        "Longitude": 7.62678344878289,
        "Latitude": 47.0372838941497
      },
      {
        "Gemeinde": "Rüdtligen-Alchenflüh",
        "Longitude": 7.57032777785275,
        "Latitude": 47.0868360924089
      },
      {
        "Gemeinde": "Rumendingen",
        "Longitude": 7.64283202331061,
        "Latitude": 47.1056197057889
      },
      {
        "Gemeinde": "Rüti bei Lyssach",
        "Longitude": 7.57814552024305,
        "Latitude": 47.0544441852926
      },
      {
        "Gemeinde": "Willadingen",
        "Longitude": 7.61398082770781,
        "Latitude": 47.1461444152321
      },
      {
        "Gemeinde": "Wynigen",
        "Longitude": 7.66654541006735,
        "Latitude": 47.1055752865327
      },
      {
        "Gemeinde": "Corgémont",
        "Longitude": 7.14172704972078,
        "Latitude": 47.1935664216531
      },
      {
        "Gemeinde": "Cormoret",
        "Longitude": 7.05346389528446,
        "Latitude": 47.1726167635394
      },
      {
        "Gemeinde": "Cortébert",
        "Longitude": 7.10744041030709,
        "Latitude": 47.1898749942158
      },
      {
        "Gemeinde": "Courtelary",
        "Longitude": 7.07320728465167,
        "Latitude": 47.1789776363151
      },
      {
        "Gemeinde": "La Ferrière",
        "Longitude": 6.89418123443268,
        "Latitude": 47.1404892717773
      },
      {
        "Gemeinde": "Mont-Tramelan",
        "Longitude": 7.0439788736853,
        "Latitude": 47.2067643414941
      },
      {
        "Gemeinde": "Orvin",
        "Longitude": 7.21444242033519,
        "Latitude": 47.1604505720579
      },
      {
        "Gemeinde": "Renan (BE)",
        "Longitude": 6.92859346478474,
        "Latitude": 47.1262549357819
      },
      {
        "Gemeinde": "Romont (BE)",
        "Longitude": 7.34099351398419,
        "Latitude": 47.1885113464787
      },
      {
        "Gemeinde": "Saint-Imier",
        "Longitude": 6.9982651138919,
        "Latitude": 47.148131998795
      },
      {
        "Gemeinde": "Sonceboz-Sombeval",
        "Longitude": 7.17866136055837,
        "Latitude": 47.1963541789643
      },
      {
        "Gemeinde": "Sonvilier",
        "Longitude": 6.96406538887268,
        "Latitude": 47.1390003597609
      },
      {
        "Gemeinde": "Tramelan",
        "Longitude": 7.10195248186543,
        "Latitude": 47.2231391851294
      },
      {
        "Gemeinde": "Villeret",
        "Longitude": 7.01928237823458,
        "Latitude": 47.1581053190483
      },
      {
        "Gemeinde": "Sauge",
        "Longitude": 7.28689439020435,
        "Latitude": 47.1884529249265
      },
      {
        "Gemeinde": "Péry-La Heutte",
        "Longitude": 7.24993036342768,
        "Latitude": 47.1937951560868
      },
      {
        "Gemeinde": "Brüttelen",
        "Longitude": 7.14793564368446,
        "Latitude": 47.0226758061374
      },
      {
        "Gemeinde": "Erlach",
        "Longitude": 7.09650380378398,
        "Latitude": 47.0432231711811
      },
      {
        "Gemeinde": "Finsterhennen",
        "Longitude": 7.17949592257215,
        "Latitude": 47.0245506853635
      },
      {
        "Gemeinde": "Gals",
        "Longitude": 7.05055932660546,
        "Latitude": 47.0277850145508
      },
      {
        "Gemeinde": "Gampelen",
        "Longitude": 7.05854843466099,
        "Latitude": 47.0143182810954
      },
      {
        "Gemeinde": "Ins",
        "Longitude": 7.10462945136141,
        "Latitude": 47.0063657781877
      },
      {
        "Gemeinde": "Lüscherz",
        "Longitude": 7.1517563094007,
        "Latitude": 47.0460734656766
      },
      {
        "Gemeinde": "Müntschemier",
        "Longitude": 7.14676751379803,
        "Latitude": 46.9956866038188
      },
      {
        "Gemeinde": "Siselen",
        "Longitude": 7.18998161760808,
        "Latitude": 47.0326696953203
      },
      {
        "Gemeinde": "Treiten",
        "Longitude": 7.16115939594306,
        "Latitude": 47.0092155783357
      },
      {
        "Gemeinde": "Tschugg",
        "Longitude": 7.07556588166935,
        "Latitude": 47.0260675735257
      },
      {
        "Gemeinde": "Vinelz",
        "Longitude": 7.11103909996694,
        "Latitude": 47.0333706439249
      },
      {
        "Gemeinde": "Bätterkinden",
        "Longitude": 7.53880337806273,
        "Latitude": 47.1309429273458
      },
      {
        "Gemeinde": "Deisswil bei Münchenbuchsee",
        "Longitude": 7.45573632251896,
        "Latitude": 47.0347372976783
      },
      {
        "Gemeinde": "Diemerswil",
        "Longitude": 7.42811091794406,
        "Latitude": 47.0185466300979
      },
      {
        "Gemeinde": "Fraubrunnen",
        "Longitude": 7.52423340276902,
        "Latitude": 47.0859801255062
      },
      {
        "Gemeinde": "Jegenstorf",
        "Longitude": 7.50574849066596,
        "Latitude": 47.0482122126223
      },
      {
        "Gemeinde": "Iffwil",
        "Longitude": 7.47944017762581,
        "Latitude": 47.0635158659929
      },
      {
        "Gemeinde": "Mattstetten",
        "Longitude": 7.51361939231751,
        "Latitude": 47.0302171486694
      },
      {
        "Gemeinde": "Moosseedorf",
        "Longitude": 7.48203425734946,
        "Latitude": 47.0158409014183
      },
      {
        "Gemeinde": "Münchenbuchsee",
        "Longitude": 7.4504706992349,
        "Latitude": 47.0212452571919
      },
      {
        "Gemeinde": "Urtenen-Schönbühl",
        "Longitude": 7.49782958896965,
        "Latitude": 47.0275276730265
      },
      {
        "Gemeinde": "Utzenstorf",
        "Longitude": 7.55724790033191,
        "Latitude": 47.1273275700467
      },
      {
        "Gemeinde": "Wiggiswil",
        "Longitude": 7.46889044435686,
        "Latitude": 47.0302371938137
      },
      {
        "Gemeinde": "Wiler bei Utzenstorf",
        "Longitude": 7.5586196910135,
        "Latitude": 47.1516124392485
      },
      {
        "Gemeinde": "Zielebach",
        "Longitude": 7.57577676230026,
        "Latitude": 47.1578897756585
      },
      {
        "Gemeinde": "Zuzwil (BE)",
        "Longitude": 7.47285019230683,
        "Latitude": 47.0509247421081
      },
      {
        "Gemeinde": "Adelboden",
        "Longitude": 7.55846691463948,
        "Latitude": 46.4931524173936
      },
      {
        "Gemeinde": "Aeschi bei Spiez",
        "Longitude": 7.69601640994529,
        "Latitude": 46.6584422817005
      },
      {
        "Gemeinde": "Frutigen",
        "Longitude": 7.64740486127041,
        "Latitude": 46.5883765737294
      },
      {
        "Gemeinde": "Kandergrund",
        "Longitude": 7.6628874380218,
        "Latitude": 46.5460677880348
      },
      {
        "Gemeinde": "Kandersteg",
        "Longitude": 7.67439816686356,
        "Latitude": 46.4947696408489
      },
      {
        "Gemeinde": "Krattigen",
        "Longitude": 7.72739188422899,
        "Latitude": 46.661965434826
      },
      {
        "Gemeinde": "Reichenbach im Kandertal",
        "Longitude": 7.69324687697745,
        "Latitude": 46.6251647943544
      },
      {
        "Gemeinde": "Beatenberg",
        "Longitude": 7.79557754146179,
        "Latitude": 46.6986550032674
      },
      {
        "Gemeinde": "Bönigen",
        "Longitude": 7.89483899158379,
        "Latitude": 46.6857069946605
      },
      {
        "Gemeinde": "Brienz (BE)",
        "Longitude": 8.03156117059825,
        "Latitude": 46.7561463056413
      },
      {
        "Gemeinde": "Brienzwiler",
        "Longitude": 8.10088416684165,
        "Latitude": 46.7521668423523
      },
      {
        "Gemeinde": "Därligen",
        "Longitude": 7.80839969534781,
        "Latitude": 46.6617316666949
      },
      {
        "Gemeinde": "Grindelwald",
        "Longitude": 8.03534058126808,
        "Latitude": 46.624787924042
      },
      {
        "Gemeinde": "Gsteigwiler",
        "Longitude": 7.87366978465259,
        "Latitude": 46.6543048714346
      },
      {
        "Gemeinde": "Gündlischwand",
        "Longitude": 7.91267128695689,
        "Latitude": 46.6325601352166
      },
      {
        "Gemeinde": "Habkern",
        "Longitude": 7.86378537246425,
        "Latitude": 46.7263083804372
      },
      {
        "Gemeinde": "Hofstetten bei Brienz",
        "Longitude": 8.07473101018604,
        "Latitude": 46.7541148403136
      },
      {
        "Gemeinde": "Interlaken",
        "Longitude": 7.85691005416527,
        "Latitude": 46.6831538468832
      },
      {
        "Gemeinde": "Iseltwald",
        "Longitude": 7.96435398308639,
        "Latitude": 46.7096966470397
      },
      {
        "Gemeinde": "Lauterbrunnen",
        "Longitude": 7.9150063704141,
        "Latitude": 46.6010646489814
      },
      {
        "Gemeinde": "Leissigen",
        "Longitude": 7.77307242050026,
        "Latitude": 46.6537443953956
      },
      {
        "Gemeinde": "Lütschental",
        "Longitude": 7.95320387908762,
        "Latitude": 46.6377822952737
      },
      {
        "Gemeinde": "Matten bei Interlaken",
        "Longitude": 7.86732395807476,
        "Latitude": 46.6777177055186
      },
      {
        "Gemeinde": "Niederried bei Interlaken",
        "Longitude": 7.93042644295421,
        "Latitude": 46.7179440161464
      },
      {
        "Gemeinde": "Oberried am Brienzersee",
        "Longitude": 7.96331782922839,
        "Latitude": 46.7375886009839
      },
      {
        "Gemeinde": "Ringgenberg (BE)",
        "Longitude": 7.89628302247574,
        "Latitude": 46.70189393872
      },
      {
        "Gemeinde": "Saxeten",
        "Longitude": 7.83173443787898,
        "Latitude": 46.6364656914406
      },
      {
        "Gemeinde": "Schwanden bei Brienz",
        "Longitude": 8.05646998692729,
        "Latitude": 46.7596125930296
      },
      {
        "Gemeinde": "Unterseen",
        "Longitude": 7.8464599440372,
        "Latitude": 46.6840913225655
      },
      {
        "Gemeinde": "Wilderswil",
        "Longitude": 7.86458895342566,
        "Latitude": 46.6624352854982
      },
      {
        "Gemeinde": "Arni (BE)",
        "Longitude": 7.6645079920188,
        "Latitude": 46.9346703012476
      },
      {
        "Gemeinde": "Biglen",
        "Longitude": 7.62770902869501,
        "Latitude": 46.9266407459533
      },
      {
        "Gemeinde": "Bowil",
        "Longitude": 7.69582249244818,
        "Latitude": 46.8923263525555
      },
      {
        "Gemeinde": "Brenzikofen",
        "Longitude": 7.61422006698196,
        "Latitude": 46.8169192825286
      },
      {
        "Gemeinde": "Freimettigen",
        "Longitude": 7.62750072945977,
        "Latitude": 46.8672717685888
      },
      {
        "Gemeinde": "Grosshöchstetten",
        "Longitude": 7.63813993727394,
        "Latitude": 46.9068333372336
      },
      {
        "Gemeinde": "Häutligen",
        "Longitude": 7.60517351132342,
        "Latitude": 46.8574114702771
      },
      {
        "Gemeinde": "Herbligen",
        "Longitude": 7.60639470059893,
        "Latitude": 46.828624825488
      },
      {
        "Gemeinde": "Kiesen",
        "Longitude": 7.58277999213057,
        "Latitude": 46.819661385658
      },
      {
        "Gemeinde": "Konolfingen",
        "Longitude": 7.62098250040231,
        "Latitude": 46.8789762830378
      },
      {
        "Gemeinde": "Landiswil",
        "Longitude": 7.67905779094111,
        "Latitude": 46.9580283272456
      },
      {
        "Gemeinde": "Linden",
        "Longitude": 7.6785639322438,
        "Latitude": 46.847387275644
      },
      {
        "Gemeinde": "Mirchel",
        "Longitude": 7.6472823684323,
        "Latitude": 46.8951232037738
      },
      {
        "Gemeinde": "Münsingen",
        "Longitude": 7.5619386697382,
        "Latitude": 46.8745573401082
      },
      {
        "Gemeinde": "Niederhünigen",
        "Longitude": 7.63802994641541,
        "Latitude": 46.8771488710565
      },
      {
        "Gemeinde": "Oberdiessbach",
        "Longitude": 7.61954034980877,
        "Latitude": 46.8402987066805
      },
      {
        "Gemeinde": "Oberthal",
        "Longitude": 7.67361794857298,
        "Latitude": 46.9157617659674
      },
      {
        "Gemeinde": "Oppligen",
        "Longitude": 7.59851010169877,
        "Latitude": 46.8214399256734
      },
      {
        "Gemeinde": "Rubigen",
        "Longitude": 7.54624600058352,
        "Latitude": 46.8988601813201
      },
      {
        "Gemeinde": "Walkringen",
        "Longitude": 7.61989736640722,
        "Latitude": 46.9464432589202
      },
      {
        "Gemeinde": "Worb",
        "Longitude": 7.56337754298369,
        "Latitude": 46.9294271792211
      },
      {
        "Gemeinde": "Zäziwil",
        "Longitude": 7.6604308455386,
        "Latitude": 46.9013953759981
      },
      {
        "Gemeinde": "Oberhünigen",
        "Longitude": 7.66296155785148,
        "Latitude": 46.878902042821
      },
      {
        "Gemeinde": "Allmendingen",
        "Longitude": 7.5252729024822,
        "Latitude": 46.9141701617725
      },
      {
        "Gemeinde": "Wichtrach",
        "Longitude": 7.57630360543928,
        "Latitude": 46.8493539421071
      },
      {
        "Gemeinde": "Clavaleyres",
        "Longitude": 7.09086577392228,
        "Latitude": 46.8983805210172
      },
      {
        "Gemeinde": "Ferenbalm",
        "Longitude": 7.21142456103266,
        "Latitude": 46.9400631080364
      },
      {
        "Gemeinde": "Frauenkappelen",
        "Longitude": 7.3374787819818,
        "Latitude": 46.9546365787236
      },
      {
        "Gemeinde": "Gurbrü",
        "Longitude": 7.21526317631252,
        "Latitude": 46.9643579020783
      },
      {
        "Gemeinde": "Kriechenwil",
        "Longitude": 7.22729808627265,
        "Latitude": 46.9113083456383
      },
      {
        "Gemeinde": "Laupen",
        "Longitude": 7.23914529461917,
        "Latitude": 46.9023342935345
      },
      {
        "Gemeinde": "Mühleberg",
        "Longitude": 7.2625979514964,
        "Latitude": 46.9545459550839
      },
      {
        "Gemeinde": "Münchenwiler",
        "Longitude": 7.12621417603791,
        "Latitude": 46.9128751707964
      },
      {
        "Gemeinde": "Neuenegg",
        "Longitude": 7.30347241552774,
        "Latitude": 46.8952325097653
      },
      {
        "Gemeinde": "Wileroltigen",
        "Longitude": 7.24020804224525,
        "Latitude": 46.9698012465086
      },
      {
        "Gemeinde": "Belprahon",
        "Longitude": 7.40558561616463,
        "Latitude": 47.2856899037542
      },
      {
        "Gemeinde": "Champoz",
        "Longitude": 7.29859319612233,
        "Latitude": 47.2559276764049
      },
      {
        "Gemeinde": "Corcelles (BE)",
        "Longitude": 7.45449374151064,
        "Latitude": 47.2847943417796
      },
      {
        "Gemeinde": "Court",
        "Longitude": 7.33825693015672,
        "Latitude": 47.2397791686779
      },
      {
        "Gemeinde": "Crémines",
        "Longitude": 7.43995377146398,
        "Latitude": 47.2829964786212
      },
      {
        "Gemeinde": "Eschert",
        "Longitude": 7.39898464942951,
        "Latitude": 47.2748945925422
      },
      {
        "Gemeinde": "Grandval",
        "Longitude": 7.42541418991907,
        "Latitude": 47.2829957485839
      },
      {
        "Gemeinde": "Loveresse",
        "Longitude": 7.23655213082754,
        "Latitude": 47.2423436129724
      },
      {
        "Gemeinde": "Moutier",
        "Longitude": 7.37122569832071,
        "Latitude": 47.2793788822817
      },
      {
        "Gemeinde": "Perrefitte",
        "Longitude": 7.34215585963509,
        "Latitude": 47.274861059109
      },
      {
        "Gemeinde": "Reconvilier",
        "Longitude": 7.22469355694311,
        "Latitude": 47.2351263169495
      },
      {
        "Gemeinde": "Roches (BE)",
        "Longitude": 7.3844190930544,
        "Latitude": 47.3018719981604
      },
      {
        "Gemeinde": "Saicourt",
        "Longitude": 7.20749075701978,
        "Latitude": 47.2431879316695
      },
      {
        "Gemeinde": "Saules (BE)",
        "Longitude": 7.21937077080911,
        "Latitude": 47.2450102780324
      },
      {
        "Gemeinde": "Schelten",
        "Longitude": 7.55108810490224,
        "Latitude": 47.3333107976484
      },
      {
        "Gemeinde": "Seehof",
        "Longitude": 7.52061526980811,
        "Latitude": 47.3045542188839
      },
      {
        "Gemeinde": "Sorvilier",
        "Longitude": 7.30524123457409,
        "Latitude": 47.2388461803585
      },
      {
        "Gemeinde": "Tavannes",
        "Longitude": 7.19834653730979,
        "Latitude": 47.2206828525638
      },
      {
        "Gemeinde": "Rebévelier",
        "Longitude": 7.17424804593715,
        "Latitude": 47.288089295009
      },
      {
        "Gemeinde": "Petit-Val",
        "Longitude": 7.24304028028833,
        "Latitude": 47.2738353888891
      },
      {
        "Gemeinde": "Valbirse",
        "Longitude": 7.27090612857018,
        "Latitude": 47.2379019310624
      },
      {
        "Gemeinde": "La Neuveville",
        "Longitude": 7.09373811653679,
        "Latitude": 47.0639040028243
      },
      {
        "Gemeinde": "Nods",
        "Longitude": 7.0802441265357,
        "Latitude": 47.1133360997176
      },
      {
        "Gemeinde": "Plateau de Diesse",
        "Longitude": 7.13039510867224,
        "Latitude": 47.099089717053
      },
      {
        "Gemeinde": "Aegerten",
        "Longitude": 7.28840253449041,
        "Latitude": 47.1218928979193
      },
      {
        "Gemeinde": "Bellmund",
        "Longitude": 7.24497336891784,
        "Latitude": 47.105636811117
      },
      {
        "Gemeinde": "Brügg",
        "Longitude": 7.28312598967116,
        "Latitude": 47.1236849275447
      },
      {
        "Gemeinde": "Bühl",
        "Longitude": 7.24510355925107,
        "Latitude": 47.0696563531685
      },
      {
        "Gemeinde": "Epsach",
        "Longitude": 7.2200901008648,
        "Latitude": 47.0696113766553
      },
      {
        "Gemeinde": "Hagneck",
        "Longitude": 7.18723622611472,
        "Latitude": 47.0569511687415
      },
      {
        "Gemeinde": "Hermrigen",
        "Longitude": 7.24374429687133,
        "Latitude": 47.081347562101
      },
      {
        "Gemeinde": "Jens",
        "Longitude": 7.26212607182462,
        "Latitude": 47.0975687610792
      },
      {
        "Gemeinde": "Ipsach",
        "Longitude": 7.23439286174687,
        "Latitude": 47.1164123792316
      },
      {
        "Gemeinde": "Ligerz",
        "Longitude": 7.13706272514529,
        "Latitude": 47.0847150299449
      },
      {
        "Gemeinde": "Merzligen",
        "Longitude": 7.25162606708121,
        "Latitude": 47.0867577330704
      },
      {
        "Gemeinde": "Mörigen",
        "Longitude": 7.2134430137525,
        "Latitude": 47.0848903890947
      },
      {
        "Gemeinde": "Nidau",
        "Longitude": 7.23963323025781,
        "Latitude": 47.1245169991163
      },
      {
        "Gemeinde": "Orpund",
        "Longitude": 7.30680995754673,
        "Latitude": 47.1390055278348
      },
      {
        "Gemeinde": "Port",
        "Longitude": 7.25547536087098,
        "Latitude": 47.1164479580545
      },
      {
        "Gemeinde": "Safnern",
        "Longitude": 7.3239238018666,
        "Latitude": 47.1498178483238
      },
      {
        "Gemeinde": "Scheuren",
        "Longitude": 7.31736797792819,
        "Latitude": 47.1336201759217
      },
      {
        "Gemeinde": "Schwadernau",
        "Longitude": 7.30683437746168,
        "Latitude": 47.1291111954561
      },
      {
        "Gemeinde": "Studen (BE)",
        "Longitude": 7.29764155618,
        "Latitude": 47.1165075206119
      },
      {
        "Gemeinde": "Sutz-Lattrigen",
        "Longitude": 7.21864023888974,
        "Latitude": 47.1019912984029
      },
      {
        "Gemeinde": "Täuffelen",
        "Longitude": 7.20035422204868,
        "Latitude": 47.0668735479218
      },
      {
        "Gemeinde": "Walperswil",
        "Longitude": 7.22802811406844,
        "Latitude": 47.0597315750064
      },
      {
        "Gemeinde": "Worben",
        "Longitude": 7.28978803826769,
        "Latitude": 47.0976080466509
      },
      {
        "Gemeinde": "Twann-Tüscherz",
        "Longitude": 7.15676894931892,
        "Latitude": 47.0937604010793
      },
      {
        "Gemeinde": "Därstetten",
        "Longitude": 7.49220292691174,
        "Latitude": 46.6596199967542
      },
      {
        "Gemeinde": "Diemtigen",
        "Longitude": 7.56534319479897,
        "Latitude": 46.6487672370206
      },
      {
        "Gemeinde": "Erlenbach im Simmental",
        "Longitude": 7.55230679284942,
        "Latitude": 46.661374743714
      },
      {
        "Gemeinde": "Oberwil im Simmental",
        "Longitude": 7.43340905447989,
        "Latitude": 46.6569338162551
      },
      {
        "Gemeinde": "Reutigen",
        "Longitude": 7.6203598494426,
        "Latitude": 46.6945698967325
      },
      {
        "Gemeinde": "Spiez",
        "Longitude": 7.68177026161215,
        "Latitude": 46.686359787498
      },
      {
        "Gemeinde": "Wimmis",
        "Longitude": 7.6412102778697,
        "Latitude": 46.6765434086692
      },
      {
        "Gemeinde": "Stocken-Höfen",
        "Longitude": 7.55503908103481,
        "Latitude": 46.7171440131008
      },
      {
        "Gemeinde": "Guttannen",
        "Longitude": 8.29046176723466,
        "Latitude": 46.6564507907155
      },
      {
        "Gemeinde": "Hasliberg",
        "Longitude": 8.17545581695694,
        "Latitude": 46.7499106253499
      },
      {
        "Gemeinde": "Innertkirchen",
        "Longitude": 8.22846492608065,
        "Latitude": 46.7054756270854
      },
      {
        "Gemeinde": "Meiringen",
        "Longitude": 8.18692085389636,
        "Latitude": 46.7273461244876
      },
      {
        "Gemeinde": "Schattenhalb",
        "Longitude": 8.19201505606005,
        "Latitude": 46.7174169428582
      },
      {
        "Gemeinde": "Boltigen",
        "Longitude": 7.39293293517911,
        "Latitude": 46.6290384363493
      },
      {
        "Gemeinde": "Lenk",
        "Longitude": 7.44254158094567,
        "Latitude": 46.4572328994863
      },
      {
        "Gemeinde": "St. Stephan",
        "Longitude": 7.39564099778465,
        "Latitude": 46.509399094957
      },
      {
        "Gemeinde": "Zweisimmen",
        "Longitude": 7.37213286009855,
        "Latitude": 46.5543658585285
      },
      {
        "Gemeinde": "Gsteig",
        "Longitude": 7.26704885156315,
        "Latitude": 46.3851379502431
      },
      {
        "Gemeinde": "Lauenen",
        "Longitude": 7.32286116301241,
        "Latitude": 46.4238895931108
      },
      {
        "Gemeinde": "Saanen",
        "Longitude": 7.27586588311296,
        "Latitude": 46.4787049100774
      },
      {
        "Gemeinde": "Guggisberg",
        "Longitude": 7.32866771860939,
        "Latitude": 46.7675252859564
      },
      {
        "Gemeinde": "Rüschegg",
        "Longitude": 7.37709424858001,
        "Latitude": 46.7774567750044
      },
      {
        "Gemeinde": "Schwarzenburg",
        "Longitude": 7.34166793749205,
        "Latitude": 46.8179111373047
      },
      {
        "Gemeinde": "Belp",
        "Longitude": 7.50030452518889,
        "Latitude": 46.890798373468
      },
      {
        "Gemeinde": "Burgistein",
        "Longitude": 7.50149340877429,
        "Latitude": 46.784652727696
      },
      {
        "Gemeinde": "Gerzensee",
        "Longitude": 7.54612772459636,
        "Latitude": 46.8394912789806
      },
      {
        "Gemeinde": "Gurzelen",
        "Longitude": 7.53291478035231,
        "Latitude": 46.7801335100658
      },
      {
        "Gemeinde": "Jaberg",
        "Longitude": 7.56966927368626,
        "Latitude": 46.8169781693519
      },
      {
        "Gemeinde": "Kaufdorf",
        "Longitude": 7.49893442278308,
        "Latitude": 46.8386263632306
      },
      {
        "Gemeinde": "Kehrsatz",
        "Longitude": 7.4714485894198,
        "Latitude": 46.9097003380547
      },
      {
        "Gemeinde": "Kirchdorf (BE)",
        "Longitude": 7.55002133652428,
        "Latitude": 46.8205972648359
      },
      {
        "Gemeinde": "Niedermuhlern",
        "Longitude": 7.46617425414164,
        "Latitude": 46.8611272182927
      },
      {
        "Gemeinde": "Riggisberg",
        "Longitude": 7.47793967330392,
        "Latitude": 46.8098502601551
      },
      {
        "Gemeinde": "Rüeggisberg",
        "Longitude": 7.43994519275945,
        "Latitude": 46.8215508753397
      },
      {
        "Gemeinde": "Rümligen",
        "Longitude": 7.49761468049184,
        "Latitude": 46.830531229245
      },
      {
        "Gemeinde": "Seftigen",
        "Longitude": 7.53947708376591,
        "Latitude": 46.7882237805482
      },
      {
        "Gemeinde": "Toffen",
        "Longitude": 7.49108908303277,
        "Latitude": 46.8593193220249
      },
      {
        "Gemeinde": "Uttigen",
        "Longitude": 7.57485367988808,
        "Latitude": 46.7944837088842
      },
      {
        "Gemeinde": "Wattenwil",
        "Longitude": 7.50933186296649,
        "Latitude": 46.7702555603488
      },
      {
        "Gemeinde": "Wald (BE)",
        "Longitude": 7.47143241095476,
        "Latitude": 46.8818150888807
      },
      {
        "Gemeinde": "Thurnen",
        "Longitude": 7.50807799811624,
        "Latitude": 46.8134342072878
      },
      {
        "Gemeinde": "Eggiwil",
        "Longitude": 7.79674698220837,
        "Latitude": 46.8749645640561
      },
      {
        "Gemeinde": "Langnau im Emmental",
        "Longitude": 7.78536445578243,
        "Latitude": 46.9406657062671
      },
      {
        "Gemeinde": "Lauperswil",
        "Longitude": 7.74481411189624,
        "Latitude": 46.9695659606196
      },
      {
        "Gemeinde": "Röthenbach im Emmental",
        "Longitude": 7.7415368261606,
        "Latitude": 46.8544343850116
      },
      {
        "Gemeinde": "Rüderswil",
        "Longitude": 7.72254612754774,
        "Latitude": 46.9831158925931
      },
      {
        "Gemeinde": "Schangnau",
        "Longitude": 7.86064912044608,
        "Latitude": 46.8270710961041
      },
      {
        "Gemeinde": "Signau",
        "Longitude": 7.72615222354819,
        "Latitude": 46.9201400353468
      },
      {
        "Gemeinde": "Trub",
        "Longitude": 7.87994804493025,
        "Latitude": 46.9430396204177
      },
      {
        "Gemeinde": "Trubschachen",
        "Longitude": 7.84432963597227,
        "Latitude": 46.9224816619538
      },
      {
        "Gemeinde": "Amsoldingen",
        "Longitude": 7.58122382727691,
        "Latitude": 46.7270096253636
      },
      {
        "Gemeinde": "Blumenstein",
        "Longitude": 7.52106914167782,
        "Latitude": 46.7405621674014
      },
      {
        "Gemeinde": "Buchholterberg",
        "Longitude": 7.69549650860106,
        "Latitude": 46.8239623879424
      },
      {
        "Gemeinde": "Eriz",
        "Longitude": 7.77783833755287,
        "Latitude": 46.7886654441295
      },
      {
        "Gemeinde": "Fahrni",
        "Longitude": 7.65474746252394,
        "Latitude": 46.7934617090988
      },
      {
        "Gemeinde": "Heiligenschwendi",
        "Longitude": 7.68728825382182,
        "Latitude": 46.7493174482957
      },
      {
        "Gemeinde": "Heimberg",
        "Longitude": 7.60628579756768,
        "Latitude": 46.7935428670159
      },
      {
        "Gemeinde": "Hilterfingen",
        "Longitude": 7.64801333294359,
        "Latitude": 46.7457978022381
      },
      {
        "Gemeinde": "Homberg",
        "Longitude": 7.6847902342504,
        "Latitude": 46.7754100855287
      },
      {
        "Gemeinde": "Horrenbach-Buchen",
        "Longitude": 7.75290729055589,
        "Latitude": 46.7806407589592
      },
      {
        "Gemeinde": "Oberhofen am Thunersee",
        "Longitude": 7.66888636755233,
        "Latitude": 46.7304651050646
      },
      {
        "Gemeinde": "Oberlangenegg",
        "Longitude": 7.74651930310478,
        "Latitude": 46.8085441611911
      },
      {
        "Gemeinde": "Pohlern",
        "Longitude": 7.54066391951568,
        "Latitude": 46.7234545630397
      },
      {
        "Gemeinde": "Sigriswil",
        "Longitude": 7.71460574207041,
        "Latitude": 46.716870532107
      },
      {
        "Gemeinde": "Steffisburg",
        "Longitude": 7.63504195073809,
        "Latitude": 46.7773051937086
      },
      {
        "Gemeinde": "Teuffenthal (BE)",
        "Longitude": 7.71093617109485,
        "Latitude": 46.7672550142315
      },
      {
        "Gemeinde": "Thierachern",
        "Longitude": 7.57212921901855,
        "Latitude": 46.7522082511282
      },
      {
        "Gemeinde": "Thun",
        "Longitude": 7.62449557884507,
        "Latitude": 46.7566330547218
      },
      {
        "Gemeinde": "Uebeschi",
        "Longitude": 7.55508395777103,
        "Latitude": 46.7378338114457
      },
      {
        "Gemeinde": "Uetendorf",
        "Longitude": 7.57218490240326,
        "Latitude": 46.7746970597151
      },
      {
        "Gemeinde": "Unterlangenegg",
        "Longitude": 7.70060313272532,
        "Latitude": 46.7960647685066
      },
      {
        "Gemeinde": "Wachseldorn",
        "Longitude": 7.7308659130024,
        "Latitude": 46.8211788652606
      },
      {
        "Gemeinde": "Zwieselberg",
        "Longitude": 7.61648195375731,
        "Latitude": 46.7080695159277
      },
      {
        "Gemeinde": "Forst-Längenbühl",
        "Longitude": 7.52241410363823,
        "Latitude": 46.7639498176754
      },
      {
        "Gemeinde": "Affoltern im Emmental",
        "Longitude": 7.73219393021759,
        "Latitude": 47.0649484709261
      },
      {
        "Gemeinde": "Dürrenroth",
        "Longitude": 7.79159197677678,
        "Latitude": 47.0890680052193
      },
      {
        "Gemeinde": "Eriswil",
        "Longitude": 7.8507807186108,
        "Latitude": 47.0789763303037
      },
      {
        "Gemeinde": "Huttwil",
        "Longitude": 7.84841478477461,
        "Latitude": 47.1140657358463
      },
      {
        "Gemeinde": "Lützelflüh",
        "Longitude": 7.68453549403493,
        "Latitude": 47.0065909765445
      },
      {
        "Gemeinde": "Rüegsau",
        "Longitude": 7.67409843084683,
        "Latitude": 47.0255028909459
      },
      {
        "Gemeinde": "Sumiswald",
        "Longitude": 7.74514758336906,
        "Latitude": 47.0280342966067
      },
      {
        "Gemeinde": "Trachselwald",
        "Longitude": 7.73850976508557,
        "Latitude": 47.0172574328013
      },
      {
        "Gemeinde": "Walterswil (BE)",
        "Longitude": 7.77593518799737,
        "Latitude": 47.1125022190195
      },
      {
        "Gemeinde": "Wyssachen",
        "Longitude": 7.82580157310409,
        "Latitude": 47.0844603268834
      },
      {
        "Gemeinde": "Attiswil",
        "Longitude": 7.61432279827382,
        "Latitude": 47.2504827122849
      },
      {
        "Gemeinde": "Berken",
        "Longitude": 7.70930591889804,
        "Latitude": 47.2251139828384
      },
      {
        "Gemeinde": "Bettenhausen",
        "Longitude": 7.71431870852851,
        "Latitude": 47.1729328747706
      },
      {
        "Gemeinde": "Farnern",
        "Longitude": 7.62230423816435,
        "Latitude": 47.2666606048862
      },
      {
        "Gemeinde": "Graben",
        "Longitude": 7.71982621849027,
        "Latitude": 47.2169935436137
      },
      {
        "Gemeinde": "Heimenhausen",
        "Longitude": 7.69998872750706,
        "Latitude": 47.2098443727613
      },
      {
        "Gemeinde": "Herzogenbuchsee",
        "Longitude": 7.70515674722638,
        "Latitude": 47.1873457291759
      },
      {
        "Gemeinde": "Inkwil",
        "Longitude": 7.67091421921436,
        "Latitude": 47.2018114789937
      },
      {
        "Gemeinde": "Niederbipp",
        "Longitude": 7.69630161936084,
        "Latitude": 47.2665192971083
      },
      {
        "Gemeinde": "Niederönz",
        "Longitude": 7.6919625069493,
        "Latitude": 47.1873754943413
      },
      {
        "Gemeinde": "Oberbipp",
        "Longitude": 7.66059832154598,
        "Latitude": 47.2602972346779
      },
      {
        "Gemeinde": "Ochlenberg",
        "Longitude": 7.73529492954838,
        "Latitude": 47.1494934570854
      },
      {
        "Gemeinde": "Rumisberg",
        "Longitude": 7.64079356584453,
        "Latitude": 47.2639314652923
      },
      {
        "Gemeinde": "Seeberg",
        "Longitude": 7.66936586341691,
        "Latitude": 47.1487450835712
      },
      {
        "Gemeinde": "Thörigen",
        "Longitude": 7.72883312833768,
        "Latitude": 47.1737965082215
      },
      {
        "Gemeinde": "Walliswil bei Niederbipp",
        "Longitude": 7.69087177478768,
        "Latitude": 47.235949437966
      },
      {
        "Gemeinde": "Walliswil bei Wangen",
        "Longitude": 7.68292336055212,
        "Latitude": 47.2305697389328
      },
      {
        "Gemeinde": "Wangen an der Aare",
        "Longitude": 7.65520750126967,
        "Latitude": 47.2342230049732
      },
      {
        "Gemeinde": "Wangenried",
        "Longitude": 7.65646587226605,
        "Latitude": 47.2189296174545
      },
      {
        "Gemeinde": "Wiedlisbach",
        "Longitude": 7.64735444510802,
        "Latitude": 47.2522268091378
      },
      {
        "Gemeinde": "Doppleschwand",
        "Longitude": 8.05550658097935,
        "Latitude": 47.0186904641687
      },
      {
        "Gemeinde": "Entlebuch",
        "Longitude": 8.06440892862767,
        "Latitude": 46.9925552962248
      },
      {
        "Gemeinde": "Flühli",
        "Longitude": 8.01590329629927,
        "Latitude": 46.8830653037935
      },
      {
        "Gemeinde": "Hasle (LU)",
        "Longitude": 8.05111927416195,
        "Latitude": 46.98003346991
      },
      {
        "Gemeinde": "Romoos",
        "Longitude": 8.027807175337,
        "Latitude": 47.0116397532951
      },
      {
        "Gemeinde": "Schüpfheim",
        "Longitude": 8.01928436792548,
        "Latitude": 46.9532129759016
      },
      {
        "Gemeinde": "Werthenstein",
        "Longitude": 8.10197355158286,
        "Latitude": 47.0535131570902
      },
      {
        "Gemeinde": "Escholzmatt-Marbach",
        "Longitude": 7.93484585361716,
        "Latitude": 46.9140300637713
      },
      {
        "Gemeinde": "Aesch (LU)",
        "Longitude": 8.24188780339047,
        "Latitude": 47.2559131519288
      },
      {
        "Gemeinde": "Altwis",
        "Longitude": 8.25218258748201,
        "Latitude": 47.237850624381
      },
      {
        "Gemeinde": "Ballwil",
        "Longitude": 8.32077820589679,
        "Latitude": 47.152789629358
      },
      {
        "Gemeinde": "Emmen",
        "Longitude": 8.29184356813265,
        "Latitude": 47.0747479805144
      },
      {
        "Gemeinde": "Ermensee",
        "Longitude": 8.24013538438615,
        "Latitude": 47.227140853398
      },
      {
        "Gemeinde": "Eschenbach (LU)",
        "Longitude": 8.32043770082489,
        "Latitude": 47.132102807808
      },
      {
        "Gemeinde": "Hitzkirch",
        "Longitude": 8.26387373168122,
        "Latitude": 47.2251742033758
      },
      {
        "Gemeinde": "Hochdorf",
        "Longitude": 8.28937736559367,
        "Latitude": 47.1683182218049
      },
      {
        "Gemeinde": "Hohenrain",
        "Longitude": 8.31859955259297,
        "Latitude": 47.1806919548483
      },
      {
        "Gemeinde": "Inwil",
        "Longitude": 8.35059763925085,
        "Latitude": 47.1228718547262
      },
      {
        "Gemeinde": "Rain",
        "Longitude": 8.25447019239416,
        "Latitude": 47.1280922786959
      },
      {
        "Gemeinde": "Römerswil",
        "Longitude": 8.2458681166762,
        "Latitude": 47.16953157905
      },
      {
        "Gemeinde": "Rothenburg",
        "Longitude": 8.26849327723551,
        "Latitude": 47.0974078230625
      },
      {
        "Gemeinde": "Schongau",
        "Longitude": 8.26454017525861,
        "Latitude": 47.2683459763359
      },
      {
        "Gemeinde": "Adligenswil",
        "Longitude": 8.36419181384208,
        "Latitude": 47.0705893604298
      },
      {
        "Gemeinde": "Buchrain",
        "Longitude": 8.34750455541135,
        "Latitude": 47.095909828752
      },
      {
        "Gemeinde": "Dierikon",
        "Longitude": 8.37124306922734,
        "Latitude": 47.0975186082803
      },
      {
        "Gemeinde": "Ebikon",
        "Longitude": 8.34200906261099,
        "Latitude": 47.082460195361
      },
      {
        "Gemeinde": "Gisikon",
        "Longitude": 8.39943421099974,
        "Latitude": 47.1269715280314
      },
      {
        "Gemeinde": "Greppen",
        "Longitude": 8.42973054573233,
        "Latitude": 47.0547492526092
      },
      {
        "Gemeinde": "Honau",
        "Longitude": 8.40613704321716,
        "Latitude": 47.1332121273721
      },
      {
        "Gemeinde": "Horw",
        "Longitude": 8.31068458420949,
        "Latitude": 47.0188337503333
      },
      {
        "Gemeinde": "Kriens",
        "Longitude": 8.27804382669425,
        "Latitude": 47.0343697370742
      },
      {
        "Gemeinde": "Luzern",
        "Longitude": 8.30993909543939,
        "Latitude": 47.0539222114756
      },
      {
        "Gemeinde": "Malters",
        "Longitude": 8.18466071967428,
        "Latitude": 47.0368140405392
      },
      {
        "Gemeinde": "Meggen",
        "Longitude": 8.37298377336782,
        "Latitude": 47.0462300404482
      },
      {
        "Gemeinde": "Meierskappel",
        "Longitude": 8.44288851536443,
        "Latitude": 47.1248012957705
      },
      {
        "Gemeinde": "Root",
        "Longitude": 8.39131929234712,
        "Latitude": 47.1153450958159
      },
      {
        "Gemeinde": "Schwarzenberg",
        "Longitude": 8.17386421885655,
        "Latitude": 47.0170935990868
      },
      {
        "Gemeinde": "Udligenswil",
        "Longitude": 8.40140680124509,
        "Latitude": 47.0900734139883
      },
      {
        "Gemeinde": "Vitznau",
        "Longitude": 8.48416221775186,
        "Latitude": 47.0110867932247
      },
      {
        "Gemeinde": "Weggis",
        "Longitude": 8.43457705985429,
        "Latitude": 47.0322182209105
      },
      {
        "Gemeinde": "Beromünster",
        "Longitude": 8.19097854731977,
        "Latitude": 47.2058849277339
      },
      {
        "Gemeinde": "Büron",
        "Longitude": 8.09471830732481,
        "Latitude": 47.2136694818657
      },
      {
        "Gemeinde": "Buttisholz",
        "Longitude": 8.09482456657361,
        "Latitude": 47.1147225306083
      },
      {
        "Gemeinde": "Eich",
        "Longitude": 8.16779423008988,
        "Latitude": 47.1511629689101
      },
      {
        "Gemeinde": "Geuensee",
        "Longitude": 8.10772749520336,
        "Latitude": 47.1983034237154
      },
      {
        "Gemeinde": "Grosswangen",
        "Longitude": 8.04891356793197,
        "Latitude": 47.1329656112999
      },
      {
        "Gemeinde": "Hildisrieden",
        "Longitude": 8.22976300973461,
        "Latitude": 47.150753274557
      },
      {
        "Gemeinde": "Knutwil",
        "Longitude": 8.07210721900488,
        "Latitude": 47.1994040135438
      },
      {
        "Gemeinde": "Mauensee",
        "Longitude": 8.06645941325555,
        "Latitude": 47.1679523643052
      },
      {
        "Gemeinde": "Neuenkirch",
        "Longitude": 8.20396617327557,
        "Latitude": 47.0987550465854
      },
      {
        "Gemeinde": "Nottwil",
        "Longitude": 8.13725815311118,
        "Latitude": 47.1351613763194
      },
      {
        "Gemeinde": "Oberkirch",
        "Longitude": 8.11511108360324,
        "Latitude": 47.1559831162096
      },
      {
        "Gemeinde": "Rickenbach (LU)",
        "Longitude": 8.1542040995855,
        "Latitude": 47.2196114274328
      },
      {
        "Gemeinde": "Ruswil",
        "Longitude": 8.1260661899975,
        "Latitude": 47.0848549840378
      },
      {
        "Gemeinde": "Schenkon",
        "Longitude": 8.13905788582532,
        "Latitude": 47.1720312248616
      },
      {
        "Gemeinde": "Schlierbach",
        "Longitude": 8.11466705653318,
        "Latitude": 47.2252472203647
      },
      {
        "Gemeinde": "Sempach",
        "Longitude": 8.19129942768665,
        "Latitude": 47.1348201755489
      },
      {
        "Gemeinde": "Sursee",
        "Longitude": 8.10739027063401,
        "Latitude": 47.1713200470739
      },
      {
        "Gemeinde": "Triengen",
        "Longitude": 8.07780521567556,
        "Latitude": 47.2344528597197
      },
      {
        "Gemeinde": "Wolhusen",
        "Longitude": 8.07307255873377,
        "Latitude": 47.0581743985546
      },
      {
        "Gemeinde": "Alberswil",
        "Longitude": 8.00166246868799,
        "Latitude": 47.1520963868759
      },
      {
        "Gemeinde": "Altbüron",
        "Longitude": 7.88190575806557,
        "Latitude": 47.1805048501528
      },
      {
        "Gemeinde": "Altishofen",
        "Longitude": 7.96127071216036,
        "Latitude": 47.2017594759864
      },
      {
        "Gemeinde": "Dagmersellen",
        "Longitude": 7.98909590519117,
        "Latitude": 47.2124237159815
      },
      {
        "Gemeinde": "Egolzwil",
        "Longitude": 8.00728933898167,
        "Latitude": 47.1853505857455
      },
      {
        "Gemeinde": "Ettiswil",
        "Longitude": 8.01745546418191,
        "Latitude": 47.1493196288489
      },
      {
        "Gemeinde": "Fischbach",
        "Longitude": 7.90806956682224,
        "Latitude": 47.1552149781669
      },
      {
        "Gemeinde": "Gettnau",
        "Longitude": 7.96858323247521,
        "Latitude": 47.1405599213979
      },
      {
        "Gemeinde": "Grossdietwil",
        "Longitude": 7.88709975936439,
        "Latitude": 47.1705900871409
      },
      {
        "Gemeinde": "Hergiswil bei Willisau",
        "Longitude": 7.95749733996024,
        "Latitude": 47.0848403907124
      },
      {
        "Gemeinde": "Luthern",
        "Longitude": 7.91644901923953,
        "Latitude": 47.0598320877522
      },
      {
        "Gemeinde": "Menznau",
        "Longitude": 8.03914243428497,
        "Latitude": 47.0844431758577
      },
      {
        "Gemeinde": "Nebikon",
        "Longitude": 7.97700838572101,
        "Latitude": 47.1917925246467
      },
      {
        "Gemeinde": "Pfaffnau",
        "Longitude": 7.8981534021298,
        "Latitude": 47.2290132832983
      },
      {
        "Gemeinde": "Reiden",
        "Longitude": 7.97095554744136,
        "Latitude": 47.2466894238544
      },
      {
        "Gemeinde": "Roggliswil",
        "Longitude": 7.8861265870337,
        "Latitude": 47.2119704580111
      },
      {
        "Gemeinde": "Schötz",
        "Longitude": 7.98866166602341,
        "Latitude": 47.1701494967336
      },
      {
        "Gemeinde": "Ufhusen",
        "Longitude": 7.89719728976152,
        "Latitude": 47.1174796375481
      },
      {
        "Gemeinde": "Wauwil",
        "Longitude": 8.02313100352605,
        "Latitude": 47.1861708006011
      },
      {
        "Gemeinde": "Wikon",
        "Longitude": 7.97110771297144,
        "Latitude": 47.261980049662
      },
      {
        "Gemeinde": "Zell (LU)",
        "Longitude": 7.92242829903428,
        "Latitude": 47.1389646052454
      },
      {
        "Gemeinde": "Willisau",
        "Longitude": 7.99079881823346,
        "Latitude": 47.1215654962976
      },
      {
        "Gemeinde": "Altdorf (UR)",
        "Longitude": 8.64301033601081,
        "Latitude": 46.8808806901973
      },
      {
        "Gemeinde": "Andermatt",
        "Longitude": 8.59571161676225,
        "Latitude": 46.6339677597635
      },
      {
        "Gemeinde": "Attinghausen",
        "Longitude": 8.63076584215623,
        "Latitude": 46.8612167423771
      },
      {
        "Gemeinde": "Bauen",
        "Longitude": 8.57989871862101,
        "Latitude": 46.9364049143764
      },
      {
        "Gemeinde": "Bürglen (UR)",
        "Longitude": 8.66256389783767,
        "Latitude": 46.8752755420331
      },
      {
        "Gemeinde": "Erstfeld",
        "Longitude": 8.65085499722371,
        "Latitude": 46.8214211395655
      },
      {
        "Gemeinde": "Flüelen",
        "Longitude": 8.62518153047463,
        "Latitude": 46.9053571142448
      },
      {
        "Gemeinde": "Göschenen",
        "Longitude": 8.58727901055374,
        "Latitude": 46.6673401133109
      },
      {
        "Gemeinde": "Gurtnellen",
        "Longitude": 8.62936925681625,
        "Latitude": 46.7388802664917
      },
      {
        "Gemeinde": "Hospental",
        "Longitude": 8.56797075927708,
        "Latitude": 46.6189519563751
      },
      {
        "Gemeinde": "Isenthal",
        "Longitude": 8.5609699261614,
        "Latitude": 46.9105029758005
      },
      {
        "Gemeinde": "Realp",
        "Longitude": 8.50229268221219,
        "Latitude": 46.5988932582779
      },
      {
        "Gemeinde": "Schattdorf",
        "Longitude": 8.65574122653868,
        "Latitude": 46.8636528095672
      },
      {
        "Gemeinde": "Seedorf (UR)",
        "Longitude": 8.61282012509798,
        "Latitude": 46.8802948781799
      },
      {
        "Gemeinde": "Seelisberg",
        "Longitude": 8.58717543122863,
        "Latitude": 46.969618380733
      },
      {
        "Gemeinde": "Silenen",
        "Longitude": 8.67111944093672,
        "Latitude": 46.7906164696456
      },
      {
        "Gemeinde": "Sisikon",
        "Longitude": 8.62221513220814,
        "Latitude": 46.9494696501598
      },
      {
        "Gemeinde": "Spiringen",
        "Longitude": 8.72810061328021,
        "Latitude": 46.8727564252431
      },
      {
        "Gemeinde": "Unterschächen",
        "Longitude": 8.76984661320678,
        "Latitude": 46.8632814994329
      },
      {
        "Gemeinde": "Wassen",
        "Longitude": 8.59987006851425,
        "Latitude": 46.7058977955333
      },
      {
        "Gemeinde": "Einsiedeln",
        "Longitude": 8.7539966523524,
        "Latitude": 47.1270603934895
      },
      {
        "Gemeinde": "Gersau",
        "Longitude": 8.52585714913924,
        "Latitude": 46.9918071866049
      },
      {
        "Gemeinde": "Feusisberg",
        "Longitude": 8.74756424991011,
        "Latitude": 47.1874071682877
      },
      {
        "Gemeinde": "Freienbach",
        "Longitude": 8.77694725203727,
        "Latitude": 47.2014624084191
      },
      {
        "Gemeinde": "Wollerau",
        "Longitude": 8.72005404800212,
        "Latitude": 47.1958130029065
      },
      {
        "Gemeinde": "Küssnacht (SZ)",
        "Longitude": 8.44077988504197,
        "Latitude": 47.0825401949549
      },
      {
        "Gemeinde": "Altendorf",
        "Longitude": 8.83081462246673,
        "Latitude": 47.1918274416353
      },
      {
        "Gemeinde": "Galgenen",
        "Longitude": 8.87411065921231,
        "Latitude": 47.1822991948912
      },
      {
        "Gemeinde": "Innerthal",
        "Longitude": 8.91950420561419,
        "Latitude": 47.1061543896743
      },
      {
        "Gemeinde": "Lachen",
        "Longitude": 8.85324301003679,
        "Latitude": 47.1915538264729
      },
      {
        "Gemeinde": "Reichenburg",
        "Longitude": 8.97536654579405,
        "Latitude": 47.1701954144596
      },
      {
        "Gemeinde": "Schübelbach",
        "Longitude": 8.92796652467123,
        "Latitude": 47.1735179007676
      },
      {
        "Gemeinde": "Tuggen",
        "Longitude": 8.94330829964889,
        "Latitude": 47.2030061990829
      },
      {
        "Gemeinde": "Vorderthal",
        "Longitude": 8.9001884082806,
        "Latitude": 47.1225952824183
      },
      {
        "Gemeinde": "Wangen (SZ)",
        "Longitude": 8.89546062350527,
        "Latitude": 47.1910269178125
      },
      {
        "Gemeinde": "Alpthal",
        "Longitude": 8.71574781914558,
        "Latitude": 47.0708158290177
      },
      {
        "Gemeinde": "Arth",
        "Longitude": 8.53766249895222,
        "Latitude": 47.0546658856795
      },
      {
        "Gemeinde": "Illgau",
        "Longitude": 8.72560823050953,
        "Latitude": 46.9879396676657
      },
      {
        "Gemeinde": "Ingenbohl",
        "Longitude": 8.6088455541239,
        "Latitude": 46.9990871111779
      },
      {
        "Gemeinde": "Lauerz",
        "Longitude": 8.57937247959707,
        "Latitude": 47.0353680399663
      },
      {
        "Gemeinde": "Morschach",
        "Longitude": 8.61896631158546,
        "Latitude": 46.9809905270728
      },
      {
        "Gemeinde": "Muotathal",
        "Longitude": 8.75815739972122,
        "Latitude": 46.974974269802
      },
      {
        "Gemeinde": "Oberiberg",
        "Longitude": 8.7821155635976,
        "Latitude": 47.0394710400649
      },
      {
        "Gemeinde": "Riemenstalden",
        "Longitude": 8.66683042558267,
        "Latitude": 46.9472010723515
      },
      {
        "Gemeinde": "Rothenthurm",
        "Longitude": 8.67570766217041,
        "Latitude": 47.1045397666578
      },
      {
        "Gemeinde": "Sattel",
        "Longitude": 8.6356688683284,
        "Latitude": 47.0815740536213
      },
      {
        "Gemeinde": "Schwyz",
        "Longitude": 8.65405192487362,
        "Latitude": 47.0211071665618
      },
      {
        "Gemeinde": "Steinen",
        "Longitude": 8.61389159941704,
        "Latitude": 47.0494133853104
      },
      {
        "Gemeinde": "Steinerberg",
        "Longitude": 8.58370284524174,
        "Latitude": 47.0533169856255
      },
      {
        "Gemeinde": "Unteriberg",
        "Longitude": 8.80235255322766,
        "Latitude": 47.0590241929177
      },
      {
        "Gemeinde": "Alpnach",
        "Longitude": 8.27395519829669,
        "Latitude": 46.9408448652148
      },
      {
        "Gemeinde": "Engelberg",
        "Longitude": 8.40447680137827,
        "Latitude": 46.8219702589579
      },
      {
        "Gemeinde": "Giswil",
        "Longitude": 8.187161214635,
        "Latitude": 46.8388932915298
      },
      {
        "Gemeinde": "Kerns",
        "Longitude": 8.27465262024624,
        "Latitude": 46.9012582968803
      },
      {
        "Gemeinde": "Lungern",
        "Longitude": 8.15760252329693,
        "Latitude": 46.7851081487803
      },
      {
        "Gemeinde": "Sachseln",
        "Longitude": 8.23873762209136,
        "Latitude": 46.8691300794038
      },
      {
        "Gemeinde": "Sarnen",
        "Longitude": 8.24438812378222,
        "Latitude": 46.896077875733
      },
      {
        "Gemeinde": "Beckenried",
        "Longitude": 8.47408972188566,
        "Latitude": 46.9661983581845
      },
      {
        "Gemeinde": "Buochs",
        "Longitude": 8.4203515576758,
        "Latitude": 46.9738678955248
      },
      {
        "Gemeinde": "Dallenwil",
        "Longitude": 8.38926893016884,
        "Latitude": 46.9255526906646
      },
      {
        "Gemeinde": "Emmetten",
        "Longitude": 8.51858056947996,
        "Latitude": 46.9567911165611
      },
      {
        "Gemeinde": "Ennetbürgen",
        "Longitude": 8.41529192451459,
        "Latitude": 46.9847061924947
      },
      {
        "Gemeinde": "Ennetmoos",
        "Longitude": 8.32126350311106,
        "Latitude": 46.9422893835082
      },
      {
        "Gemeinde": "Hergiswil (NW)",
        "Longitude": 8.31148758317519,
        "Latitude": 46.987342896799
      },
      {
        "Gemeinde": "Oberdorf (NW)",
        "Longitude": 8.38590026083501,
        "Latitude": 46.9579652310765
      },
      {
        "Gemeinde": "Stans",
        "Longitude": 8.36617964806372,
        "Latitude": 46.957226898199
      },
      {
        "Gemeinde": "Stansstad",
        "Longitude": 8.33892399167768,
        "Latitude": 46.9772353366554
      },
      {
        "Gemeinde": "Wolfenschiessen",
        "Longitude": 8.39554508096132,
        "Latitude": 46.9093074001704
      },
      {
        "Gemeinde": "Glarus Nord",
        "Longitude": 9.06161899488165,
        "Latitude": 47.0997353305528
      },
      {
        "Gemeinde": "Glarus Süd",
        "Longitude": 9.07289408891745,
        "Latitude": 46.9943107725728
      },
      {
        "Gemeinde": "Glarus",
        "Longitude": 9.06642761327233,
        "Latitude": 47.04118719881
      },
      {
        "Gemeinde": "Baar",
        "Longitude": 8.52868971151081,
        "Latitude": 47.1959849024396
      },
      {
        "Gemeinde": "Cham",
        "Longitude": 8.45978228089501,
        "Latitude": 47.1813246501678
      },
      {
        "Gemeinde": "Hünenberg",
        "Longitude": 8.4266536368687,
        "Latitude": 47.1735179618019
      },
      {
        "Gemeinde": "Menzingen",
        "Longitude": 8.59035719574481,
        "Latitude": 47.1791923239697
      },
      {
        "Gemeinde": "Neuheim",
        "Longitude": 8.57508234789542,
        "Latitude": 47.2054315673084
      },
      {
        "Gemeinde": "Oberägeri",
        "Longitude": 8.61445040902959,
        "Latitude": 47.1348692138805
      },
      {
        "Gemeinde": "Risch",
        "Longitude": 8.42869229511671,
        "Latitude": 47.1411164369588
      },
      {
        "Gemeinde": "Steinhausen",
        "Longitude": 8.48516301542861,
        "Latitude": 47.1972885643499
      },
      {
        "Gemeinde": "Unterägeri",
        "Longitude": 8.5841752046705,
        "Latitude": 47.136973912734
      },
      {
        "Gemeinde": "Walchwil",
        "Longitude": 8.51489503833369,
        "Latitude": 47.1007604930252
      },
      {
        "Gemeinde": "Zug",
        "Longitude": 8.51757086620722,
        "Latitude": 47.1682033658242
      },
      {
        "Gemeinde": "Châtillon (FR)",
        "Longitude": 6.82782970284822,
        "Latitude": 46.8325088290179
      },
      {
        "Gemeinde": "Cheiry",
        "Longitude": 6.83662230617555,
        "Latitude": 46.749795946574
      },
      {
        "Gemeinde": "Cugy (FR)",
        "Longitude": 6.89093595490235,
        "Latitude": 46.8139380126141
      },
      {
        "Gemeinde": "Fétigny",
        "Longitude": 6.91598829885209,
        "Latitude": 46.7978630504941
      },
      {
        "Gemeinde": "Gletterens",
        "Longitude": 6.93735119057313,
        "Latitude": 46.8951114616717
      },
      {
        "Gemeinde": "Lully (FR)",
        "Longitude": 6.84616954222473,
        "Latitude": 46.8335049827948
      },
      {
        "Gemeinde": "Ménières",
        "Longitude": 6.88077181925282,
        "Latitude": 46.7833037175129
      },
      {
        "Gemeinde": "Montagny (FR)",
        "Longitude": 6.99573488416407,
        "Latitude": 46.8170916416379
      },
      {
        "Gemeinde": "Nuvilly",
        "Longitude": 6.8310110616906,
        "Latitude": 46.7830496486141
      },
      {
        "Gemeinde": "Prévondavaux",
        "Longitude": 6.79629051801292,
        "Latitude": 46.7297856843635
      },
      {
        "Gemeinde": "Saint-Aubin (FR)",
        "Longitude": 6.98069325749669,
        "Latitude": 46.8907953336353
      },
      {
        "Gemeinde": "Sévaz",
        "Longitude": 6.87495876491945,
        "Latitude": 46.8381486060356
      },
      {
        "Gemeinde": "Surpierre",
        "Longitude": 6.86023620019351,
        "Latitude": 46.7445205820929
      },
      {
        "Gemeinde": "Vallon",
        "Longitude": 6.9545080558615,
        "Latitude": 46.8843910357592
      },
      {
        "Gemeinde": "Les Montets",
        "Longitude": 6.86864285247418,
        "Latitude": 46.8156279674734
      },
      {
        "Gemeinde": "Delley-Portalban",
        "Longitude": 6.95552902773575,
        "Latitude": 46.9167782670886
      },
      {
        "Gemeinde": "Belmont-Broye",
        "Longitude": 7.01368820479893,
        "Latitude": 46.8666363712083
      },
      {
        "Gemeinde": "Estavayer",
        "Longitude": 6.84861333501324,
        "Latitude": 46.84971027717
      },
      {
        "Gemeinde": "Cheyres-Châbles",
        "Longitude": 6.78741642050445,
        "Latitude": 46.8142945046414
      },
      {
        "Gemeinde": "Auboranges",
        "Longitude": 6.805872435302,
        "Latitude": 46.5823083037654
      },
      {
        "Gemeinde": "Billens-Hennens",
        "Longitude": 6.8987250047494,
        "Latitude": 46.6907352317157
      },
      {
        "Gemeinde": "Chapelle (Glâne)",
        "Longitude": 6.83451305649189,
        "Latitude": 46.5878613760149
      },
      {
        "Gemeinde": "Le Châtelard",
        "Longitude": 6.97727536357151,
        "Latitude": 46.6775874718894
      },
      {
        "Gemeinde": "Châtonnaye",
        "Longitude": 6.93866597031041,
        "Latitude": 46.7538869947412
      },
      {
        "Gemeinde": "Ecublens (FR)",
        "Longitude": 6.80947148199432,
        "Latitude": 46.6093157517431
      },
      {
        "Gemeinde": "Grangettes",
        "Longitude": 6.96028535273448,
        "Latitude": 46.6775172365409
      },
      {
        "Gemeinde": "Massonnens",
        "Longitude": 6.97446811724003,
        "Latitude": 46.7000650013358
      },
      {
        "Gemeinde": "Mézières (FR)",
        "Longitude": 6.92629689892259,
        "Latitude": 46.6782687049914
      },
      {
        "Gemeinde": "Montet (Glâne)",
        "Longitude": 6.81428613036467,
        "Latitude": 46.6444258255616
      },
      {
        "Gemeinde": "Romont (FR)",
        "Longitude": 6.91958892222197,
        "Latitude": 46.6962295252859
      },
      {
        "Gemeinde": "Rue",
        "Longitude": 6.82370581328823,
        "Latitude": 46.6201883067072
      },
      {
        "Gemeinde": "Siviriez",
        "Longitude": 6.87814613661382,
        "Latitude": 46.6582514302202
      },
      {
        "Gemeinde": "Ursy",
        "Longitude": 6.83398783040665,
        "Latitude": 46.6346364685712
      },
      {
        "Gemeinde": "Vuisternens-devant-Romont",
        "Longitude": 6.92912293605365,
        "Latitude": 46.6557923563476
      },
      {
        "Gemeinde": "Villorsonnens",
        "Longitude": 6.99525467334991,
        "Latitude": 46.7163398492586
      },
      {
        "Gemeinde": "Torny",
        "Longitude": 6.96600801072469,
        "Latitude": 46.770195005864
      },
      {
        "Gemeinde": "Villaz",
        "Longitude": 6.95729454722305,
        "Latitude": 46.7197838720822
      },
      {
        "Gemeinde": "Haut-Intyamon",
        "Longitude": 7.05552427843764,
        "Latitude": 46.5177547644126
      },
      {
        "Gemeinde": "Pont-en-Ogoz",
        "Longitude": 7.08569297298469,
        "Latitude": 46.6869706070923
      },
      {
        "Gemeinde": "Botterens",
        "Longitude": 7.1122345951635,
        "Latitude": 46.6213820247298
      },
      {
        "Gemeinde": "Broc",
        "Longitude": 7.09929183567865,
        "Latitude": 46.603353111952
      },
      {
        "Gemeinde": "Bulle",
        "Longitude": 7.05744403017306,
        "Latitude": 46.6149146100848
      },
      {
        "Gemeinde": "Châtel-sur-Montsalvens",
        "Longitude": 7.12533762222276,
        "Latitude": 46.6133228769418
      },
      {
        "Gemeinde": "Corbières",
        "Longitude": 7.10155338620719,
        "Latitude": 46.6591323429389
      },
      {
        "Gemeinde": "Crésuz",
        "Longitude": 7.13966693222521,
        "Latitude": 46.6187588176628
      },
      {
        "Gemeinde": "Echarlens",
        "Longitude": 7.07418986979616,
        "Latitude": 46.6482531671225
      },
      {
        "Gemeinde": "Grandvillard",
        "Longitude": 7.08666318992097,
        "Latitude": 46.5385455893959
      },
      {
        "Gemeinde": "Gruyères",
        "Longitude": 7.0824552478265,
        "Latitude": 46.5835107439329
      },
      {
        "Gemeinde": "Hauteville",
        "Longitude": 7.10932632791517,
        "Latitude": 46.6699497664219
      },
      {
        "Gemeinde": "Jaun",
        "Longitude": 7.2780779171053,
        "Latitude": 46.610942566148
      },
      {
        "Gemeinde": "Marsens",
        "Longitude": 7.06238344498435,
        "Latitude": 46.6554112112815
      },
      {
        "Gemeinde": "Morlon",
        "Longitude": 7.08609306678237,
        "Latitude": 46.6258016105027
      },
      {
        "Gemeinde": "Le Pâquier (FR)",
        "Longitude": 7.05498721167379,
        "Latitude": 46.5933172505539
      },
      {
        "Gemeinde": "Pont-la-Ville",
        "Longitude": 7.11044707995442,
        "Latitude": 46.7005379960119
      },
      {
        "Gemeinde": "Riaz",
        "Longitude": 7.06118395790226,
        "Latitude": 46.6401145785002
      },
      {
        "Gemeinde": "La Roche",
        "Longitude": 7.13792967437254,
        "Latitude": 46.6961161539694
      },
      {
        "Gemeinde": "Sâles",
        "Longitude": 6.9737201499994,
        "Latitude": 46.6352931241706
      },
      {
        "Gemeinde": "Sorens",
        "Longitude": 7.05967595509904,
        "Latitude": 46.6688958141851
      },
      {
        "Gemeinde": "Vaulruz",
        "Longitude": 6.98951004633743,
        "Latitude": 46.6209633842646
      },
      {
        "Gemeinde": "Vuadens",
        "Longitude": 7.02217702772159,
        "Latitude": 46.6174893819365
      },
      {
        "Gemeinde": "Bas-Intyamon",
        "Longitude": 7.08387298324728,
        "Latitude": 46.5664236535638
      },
      {
        "Gemeinde": "Val-de-Charmey",
        "Longitude": 7.16184232986747,
        "Latitude": 46.6224130367402
      },
      {
        "Gemeinde": "Arconciel",
        "Longitude": 7.12325385099309,
        "Latitude": 46.7464513782267
      },
      {
        "Gemeinde": "Autigny",
        "Longitude": 7.02125836984307,
        "Latitude": 46.7362285706793
      },
      {
        "Gemeinde": "Avry",
        "Longitude": 7.07062032068172,
        "Latitude": 46.7885724864302
      },
      {
        "Gemeinde": "Belfaux",
        "Longitude": 7.10709082621176,
        "Latitude": 46.8210683858245
      },
      {
        "Gemeinde": "Chénens",
        "Longitude": 7.00159680267266,
        "Latitude": 46.7406519410215
      },
      {
        "Gemeinde": "Corminboeuf",
        "Longitude": 7.10454817723329,
        "Latitude": 46.8084671987001
      },
      {
        "Gemeinde": "Cottens (FR)",
        "Longitude": 7.03160964420137,
        "Latitude": 46.7515579924579
      },
      {
        "Gemeinde": "Ependes (FR)",
        "Longitude": 7.1454562329006,
        "Latitude": 46.7546066908476
      },
      {
        "Gemeinde": "Ferpicloz",
        "Longitude": 7.16774232187983,
        "Latitude": 46.7474654768263
      },
      {
        "Gemeinde": "Fribourg",
        "Longitude": 7.14912164466239,
        "Latitude": 46.8031919139528
      },
      {
        "Gemeinde": "Givisiez",
        "Longitude": 7.13071986374963,
        "Latitude": 46.8139381710449
      },
      {
        "Gemeinde": "Granges-Paccot",
        "Longitude": 7.14245269812056,
        "Latitude": 46.8247638531173
      },
      {
        "Gemeinde": "Grolley",
        "Longitude": 7.07031259573508,
        "Latitude": 46.833549460298
      },
      {
        "Gemeinde": "Marly",
        "Longitude": 7.16105035949159,
        "Latitude": 46.7762350772058
      },
      {
        "Gemeinde": "Matran",
        "Longitude": 7.09684159142086,
        "Latitude": 46.784156325135
      },
      {
        "Gemeinde": "Neyruz (FR)",
        "Longitude": 7.0655252188535,
        "Latitude": 46.7678662660155
      },
      {
        "Gemeinde": "Pierrafortscha",
        "Longitude": 7.18587781238347,
        "Latitude": 46.7870880791916
      },
      {
        "Gemeinde": "Ponthaux",
        "Longitude": 7.04029956916324,
        "Latitude": 46.8154580448761
      },
      {
        "Gemeinde": "Le Mouret",
        "Longitude": 7.17819405036631,
        "Latitude": 46.7510881337392
      },
      {
        "Gemeinde": "Senèdes",
        "Longitude": 7.14290782582766,
        "Latitude": 46.7420062978121
      },
      {
        "Gemeinde": "Treyvaux",
        "Longitude": 7.1377592861986,
        "Latitude": 46.7267003077439
      },
      {
        "Gemeinde": "Villars-sur-Glâne",
        "Longitude": 7.13740169064722,
        "Latitude": 46.7905675248897
      },
      {
        "Gemeinde": "Villarsel-sur-Marly",
        "Longitude": 7.17421914839736,
        "Latitude": 46.7609740012864
      },
      {
        "Gemeinde": "Hauterive (FR)",
        "Longitude": 7.09568138563603,
        "Latitude": 46.7607645245107
      },
      {
        "Gemeinde": "La Brillaz",
        "Longitude": 7.00406851983834,
        "Latitude": 46.7586521660888
      },
      {
        "Gemeinde": "La Sonnaz",
        "Longitude": 7.13453860090057,
        "Latitude": 46.8337385502785
      },
      {
        "Gemeinde": "Gibloux",
        "Longitude": 7.06584894170741,
        "Latitude": 46.7210904225382
      },
      {
        "Gemeinde": "Prez",
        "Longitude": 7.01563655371967,
        "Latitude": 46.7856826193845
      },
      {
        "Gemeinde": "Courgevaux",
        "Longitude": 7.11181877136475,
        "Latitude": 46.9056384141061
      },
      {
        "Gemeinde": "Courtepin",
        "Longitude": 7.12519025962699,
        "Latitude": 46.863397880345
      },
      {
        "Gemeinde": "Cressier (FR)",
        "Longitude": 7.14073335270806,
        "Latitude": 46.8985212589402
      },
      {
        "Gemeinde": "Fräschels",
        "Longitude": 7.20855099153694,
        "Latitude": 46.9976268135407
      },
      {
        "Gemeinde": "Galmiz",
        "Longitude": 7.15883928494133,
        "Latitude": 46.9498407068836
      },
      {
        "Gemeinde": "Gempenach",
        "Longitude": 7.1982871040259,
        "Latitude": 46.9409355555116
      },
      {
        "Gemeinde": "Greng",
        "Longitude": 7.09472197069404,
        "Latitude": 46.9109855655609
      },
      {
        "Gemeinde": "Gurmels",
        "Longitude": 7.17225592438587,
        "Latitude": 46.8932020713535
      },
      {
        "Gemeinde": "Kerzers",
        "Longitude": 7.19682395204905,
        "Latitude": 46.9742153093833
      },
      {
        "Gemeinde": "Kleinbösingen",
        "Longitude": 7.20505715855755,
        "Latitude": 46.8941735504051
      },
      {
        "Gemeinde": "Meyriez",
        "Longitude": 7.10777059940147,
        "Latitude": 46.9236177323139
      },
      {
        "Gemeinde": "Misery-Courtion",
        "Longitude": 7.06625003067305,
        "Latitude": 46.8524264347952
      },
      {
        "Gemeinde": "Muntelier",
        "Longitude": 7.12345722879109,
        "Latitude": 46.9353557684495
      },
      {
        "Gemeinde": "Murten",
        "Longitude": 7.11825259739534,
        "Latitude": 46.9272456058569
      },
      {
        "Gemeinde": "Ried bei Kerzers",
        "Longitude": 7.18640349381489,
        "Latitude": 46.9544027275853
      },
      {
        "Gemeinde": "Ulmiz",
        "Longitude": 7.20095364949057,
        "Latitude": 46.9319459241923
      },
      {
        "Gemeinde": "Mont-Vully",
        "Longitude": 7.11018161792794,
        "Latitude": 46.9587063631261
      },
      {
        "Gemeinde": "Alterswil",
        "Longitude": 7.26050301032794,
        "Latitude": 46.7944254492252
      },
      {
        "Gemeinde": "Brünisried",
        "Longitude": 7.27763037024933,
        "Latitude": 46.7611672825571
      },
      {
        "Gemeinde": "Düdingen",
        "Longitude": 7.19084290593347,
        "Latitude": 46.8464682105257
      },
      {
        "Gemeinde": "Giffers",
        "Longitude": 7.21087084262222,
        "Latitude": 46.761053234223
      },
      {
        "Gemeinde": "Bösingen",
        "Longitude": 7.22868445603319,
        "Latitude": 46.8924205628974
      },
      {
        "Gemeinde": "Heitenried",
        "Longitude": 7.29971290649955,
        "Latitude": 46.8268630092764
      },
      {
        "Gemeinde": "Plaffeien",
        "Longitude": 7.28815965153323,
        "Latitude": 46.7404921511042
      },
      {
        "Gemeinde": "Plasselb",
        "Longitude": 7.25285458406841,
        "Latitude": 46.7332436316035
      },
      {
        "Gemeinde": "Rechthalten",
        "Longitude": 7.24095120589359,
        "Latitude": 46.7683058192119
      },
      {
        "Gemeinde": "St. Antoni",
        "Longitude": 7.26041057182678,
        "Latitude": 46.8223108440978
      },
      {
        "Gemeinde": "St. Silvester",
        "Longitude": 7.22011414335101,
        "Latitude": 46.7412813401479
      },
      {
        "Gemeinde": "St. Ursen",
        "Longitude": 7.21860730323572,
        "Latitude": 46.7898540775287
      },
      {
        "Gemeinde": "Schmitten (FR)",
        "Longitude": 7.24718695900373,
        "Latitude": 46.8555720361773
      },
      {
        "Gemeinde": "Tafers",
        "Longitude": 7.21719400349719,
        "Latitude": 46.8150383732377
      },
      {
        "Gemeinde": "Tentlingen",
        "Longitude": 7.19773672326707,
        "Latitude": 46.7709210736231
      },
      {
        "Gemeinde": "Ueberstorf",
        "Longitude": 7.31141886330477,
        "Latitude": 46.864657395246
      },
      {
        "Gemeinde": "Wünnewil-Flamatt",
        "Longitude": 7.27728961885203,
        "Latitude": 46.8745090526185
      },
      {
        "Gemeinde": "Attalens",
        "Longitude": 6.84840626430716,
        "Latitude": 46.5105703121555
      },
      {
        "Gemeinde": "Bossonnens",
        "Longitude": 6.84828828141063,
        "Latitude": 46.5213647490646
      },
      {
        "Gemeinde": "Châtel-Saint-Denis",
        "Longitude": 6.90166359463605,
        "Latitude": 46.5270268822443
      },
      {
        "Gemeinde": "Granges (Veveyse)",
        "Longitude": 6.83000383945364,
        "Latitude": 46.5248665502548
      },
      {
        "Gemeinde": "Remaufens",
        "Longitude": 6.87819531326538,
        "Latitude": 46.5278131316684
      },
      {
        "Gemeinde": "Saint-Martin (FR)",
        "Longitude": 6.86855961505584,
        "Latitude": 46.5763422928081
      },
      {
        "Gemeinde": "Semsales",
        "Longitude": 6.92859105297132,
        "Latitude": 46.5739287158159
      },
      {
        "Gemeinde": "Le Flon",
        "Longitude": 6.86699813806083,
        "Latitude": 46.6006228983748
      },
      {
        "Gemeinde": "La Verrerie",
        "Longitude": 6.92192241014962,
        "Latitude": 46.5891914372099
      },
      {
        "Gemeinde": "Staatswald Galm",
        "Longitude": 7.16952336458017,
        "Latitude": 46.9147846704261
      },
      {
        "Gemeinde": "Egerkingen",
        "Longitude": 7.79313106513172,
        "Latitude": 47.3220290571429
      },
      {
        "Gemeinde": "Härkingen",
        "Longitude": 7.81817350666666,
        "Latitude": 47.3093572941079
      },
      {
        "Gemeinde": "Kestenholz",
        "Longitude": 7.75453223780283,
        "Latitude": 47.2816656719448
      },
      {
        "Gemeinde": "Neuendorf",
        "Longitude": 7.79565048868152,
        "Latitude": 47.3031331029207
      },
      {
        "Gemeinde": "Niederbuchsiten",
        "Longitude": 7.77181046448403,
        "Latitude": 47.2969080937431
      },
      {
        "Gemeinde": "Oberbuchsiten",
        "Longitude": 7.76659917172596,
        "Latitude": 47.3095150654429
      },
      {
        "Gemeinde": "Oensingen",
        "Longitude": 7.71756989145116,
        "Latitude": 47.2907553848811
      },
      {
        "Gemeinde": "Wolfwil",
        "Longitude": 7.79807095900176,
        "Latitude": 47.2698453442939
      },
      {
        "Gemeinde": "Aedermannsdorf",
        "Longitude": 7.60921329434636,
        "Latitude": 47.3053573611945
      },
      {
        "Gemeinde": "Balsthal",
        "Longitude": 7.69389505385938,
        "Latitude": 47.3159947420215
      },
      {
        "Gemeinde": "Gänsbrunnen",
        "Longitude": 7.46769915652169,
        "Latitude": 47.2614062318713
      },
      {
        "Gemeinde": "Herbetswil",
        "Longitude": 7.59199700467843,
        "Latitude": 47.2963869507234
      },
      {
        "Gemeinde": "Holderbank (SO)",
        "Longitude": 7.7561584889685,
        "Latitude": 47.3329298614327
      },
      {
        "Gemeinde": "Laupersdorf",
        "Longitude": 7.6502416758089,
        "Latitude": 47.3142839086755
      },
      {
        "Gemeinde": "Matzendorf",
        "Longitude": 7.6290549087428,
        "Latitude": 47.3071252699044
      },
      {
        "Gemeinde": "Mümliswil-Ramiswil",
        "Longitude": 7.70195467291691,
        "Latitude": 47.3411611291153
      },
      {
        "Gemeinde": "Welschenrohr",
        "Longitude": 7.52850936759072,
        "Latitude": 47.281163131584
      },
      {
        "Gemeinde": "Biezwil",
        "Longitude": 7.4175512884961,
        "Latitude": 47.1138936570793
      },
      {
        "Gemeinde": "Lüterkofen-Ichertswil",
        "Longitude": 7.51248593896423,
        "Latitude": 47.162444998809
      },
      {
        "Gemeinde": "Lüterswil-Gächliwil",
        "Longitude": 7.43863330719683,
        "Latitude": 47.1201925307077
      },
      {
        "Gemeinde": "Messen",
        "Longitude": 7.44785262839287,
        "Latitude": 47.0923070558108
      },
      {
        "Gemeinde": "Schnottwil",
        "Longitude": 7.39120122938645,
        "Latitude": 47.111187216582
      },
      {
        "Gemeinde": "Unterramsern",
        "Longitude": 7.48343670460382,
        "Latitude": 47.1192843018475
      },
      {
        "Gemeinde": "Lüsslingen-Nennigkofen",
        "Longitude": 7.5019672399874,
        "Latitude": 47.1903351024434
      },
      {
        "Gemeinde": "Buchegg",
        "Longitude": 7.47554041394433,
        "Latitude": 47.1345783894514
      },
      {
        "Gemeinde": "Bättwil",
        "Longitude": 7.51028238567763,
        "Latitude": 47.4898432964443
      },
      {
        "Gemeinde": "Büren (SO)",
        "Longitude": 7.67066529691239,
        "Latitude": 47.4491601218042
      },
      {
        "Gemeinde": "Dornach",
        "Longitude": 7.61507796758606,
        "Latitude": 47.4798381036816
      },
      {
        "Gemeinde": "Gempen",
        "Longitude": 7.65883976306838,
        "Latitude": 47.4752662297359
      },
      {
        "Gemeinde": "Hochwald",
        "Longitude": 7.64019643710868,
        "Latitude": 47.4564124917513
      },
      {
        "Gemeinde": "Hofstetten-Flüh",
        "Longitude": 7.51556955747885,
        "Latitude": 47.4754494886291
      },
      {
        "Gemeinde": "Metzerlen-Mariastein",
        "Longitude": 7.46515541304647,
        "Latitude": 47.4664776125189
      },
      {
        "Gemeinde": "Nuglar-St. Pantaleon",
        "Longitude": 7.69331329074817,
        "Latitude": 47.471598009863
      },
      {
        "Gemeinde": "Rodersdorf",
        "Longitude": 7.45720203861175,
        "Latitude": 47.4808695559245
      },
      {
        "Gemeinde": "Seewen",
        "Longitude": 7.65866896013434,
        "Latitude": 47.4338933804642
      },
      {
        "Gemeinde": "Witterswil",
        "Longitude": 7.52221777708343,
        "Latitude": 47.4853383316641
      },
      {
        "Gemeinde": "Hauenstein-Ifenthal",
        "Longitude": 7.85570696267069,
        "Latitude": 47.373987603729
      },
      {
        "Gemeinde": "Kienberg",
        "Longitude": 7.96625098625866,
        "Latitude": 47.4391952511966
      },
      {
        "Gemeinde": "Lostorf",
        "Longitude": 7.94715943403403,
        "Latitude": 47.3835154748445
      },
      {
        "Gemeinde": "Niedergösgen",
        "Longitude": 7.99074851715277,
        "Latitude": 47.3725219411807
      },
      {
        "Gemeinde": "Obergösgen",
        "Longitude": 7.952274618276,
        "Latitude": 47.364604337052
      },
      {
        "Gemeinde": "Rohr (SO)",
        "Longitude": 7.95535779370145,
        "Latitude": 47.4095629811929
      },
      {
        "Gemeinde": "Stüsslingen",
        "Longitude": 7.96975268682834,
        "Latitude": 47.3915089205975
      },
      {
        "Gemeinde": "Trimbach",
        "Longitude": 7.90195436259278,
        "Latitude": 47.3630181835745
      },
      {
        "Gemeinde": "Winznau",
        "Longitude": 7.93374137007495,
        "Latitude": 47.3646852636224
      },
      {
        "Gemeinde": "Wisen (SO)",
        "Longitude": 7.88631792333379,
        "Latitude": 47.3927614335607
      },
      {
        "Gemeinde": "Erlinsbach (SO)",
        "Longitude": 8.00689522181067,
        "Latitude": 47.3967288243188
      },
      {
        "Gemeinde": "Aeschi (SO)",
        "Longitude": 7.66290553891715,
        "Latitude": 47.1802401737687
      },
      {
        "Gemeinde": "Biberist",
        "Longitude": 7.55868817392406,
        "Latitude": 47.1821947193329
      },
      {
        "Gemeinde": "Bolken",
        "Longitude": 7.6629506496081,
        "Latitude": 47.1910337572038
      },
      {
        "Gemeinde": "Deitingen",
        "Longitude": 7.6208053094884,
        "Latitude": 47.214494407542
      },
      {
        "Gemeinde": "Derendingen",
        "Longitude": 7.58643061768933,
        "Latitude": 47.1956546602393
      },
      {
        "Gemeinde": "Etziken",
        "Longitude": 7.6470989926948,
        "Latitude": 47.1865662370562
      },
      {
        "Gemeinde": "Gerlafingen",
        "Longitude": 7.57185199837245,
        "Latitude": 47.1704871074015
      },
      {
        "Gemeinde": "Halten",
        "Longitude": 7.60350540856868,
        "Latitude": 47.1695467730154
      },
      {
        "Gemeinde": "Horriwil",
        "Longitude": 7.62465010311318,
        "Latitude": 47.1812078009372
      },
      {
        "Gemeinde": "Hüniken",
        "Longitude": 7.63521763119366,
        "Latitude": 47.184788164647
      },
      {
        "Gemeinde": "Kriegstetten",
        "Longitude": 7.59692908495924,
        "Latitude": 47.1758523218976
      },
      {
        "Gemeinde": "Lohn-Ammannsegg",
        "Longitude": 7.52436667665501,
        "Latitude": 47.1696326341606
      },
      {
        "Gemeinde": "Luterbach",
        "Longitude": 7.5864853205531,
        "Latitude": 47.2154429822534
      },
      {
        "Gemeinde": "Obergerlafingen",
        "Longitude": 7.58501986218301,
        "Latitude": 47.1623758541119
      },
      {
        "Gemeinde": "Oekingen",
        "Longitude": 7.60485520305549,
        "Latitude": 47.1794391033311
      },
      {
        "Gemeinde": "Recherswil",
        "Longitude": 7.5955676293013,
        "Latitude": 47.1614625097269
      },
      {
        "Gemeinde": "Subingen",
        "Longitude": 7.61678525172189,
        "Latitude": 47.1965113647579
      },
      {
        "Gemeinde": "Zuchwil",
        "Longitude": 7.54817381195172,
        "Latitude": 47.2019936351893
      },
      {
        "Gemeinde": "Drei Höfe",
        "Longitude": 7.63511491897425,
        "Latitude": 47.156904381245
      },
      {
        "Gemeinde": "Balm bei Günsberg",
        "Longitude": 7.55884703594213,
        "Latitude": 47.253252513472
      },
      {
        "Gemeinde": "Bellach",
        "Longitude": 7.49143316679243,
        "Latitude": 47.2119276137755
      },
      {
        "Gemeinde": "Bettlach",
        "Longitude": 7.4241145973811,
        "Latitude": 47.202943989251
      },
      {
        "Gemeinde": "Feldbrunnen-St. Niklaus",
        "Longitude": 7.55613414082666,
        "Latitude": 47.2208747014175
      },
      {
        "Gemeinde": "Flumenthal",
        "Longitude": 7.59974859789392,
        "Latitude": 47.2361127929643
      },
      {
        "Gemeinde": "Grenchen",
        "Longitude": 7.39508714461927,
        "Latitude": 47.1930424982634
      },
      {
        "Gemeinde": "Günsberg",
        "Longitude": 7.57735350583168,
        "Latitude": 47.257729056522
      },
      {
        "Gemeinde": "Hubersdorf",
        "Longitude": 7.58921392413651,
        "Latitude": 47.2469205461072
      },
      {
        "Gemeinde": "Kammersrohr",
        "Longitude": 7.59319733809367,
        "Latitude": 47.2541109157876
      },
      {
        "Gemeinde": "Langendorf",
        "Longitude": 7.51520731321222,
        "Latitude": 47.2218086138902
      },
      {
        "Gemeinde": "Lommiswil",
        "Longitude": 7.47163998573137,
        "Latitude": 47.2236279697342
      },
      {
        "Gemeinde": "Oberdorf (SO)",
        "Longitude": 7.50333472720121,
        "Latitude": 47.2299109565936
      },
      {
        "Gemeinde": "Riedholz",
        "Longitude": 7.5653952121589,
        "Latitude": 47.2289600919832
      },
      {
        "Gemeinde": "Rüttenen",
        "Longitude": 7.5310659467975,
        "Latitude": 47.230791607813
      },
      {
        "Gemeinde": "Selzach",
        "Longitude": 7.45315094568603,
        "Latitude": 47.2056424153322
      },
      {
        "Gemeinde": "Boningen",
        "Longitude": 7.85651679035008,
        "Latitude": 47.3083252289265
      },
      {
        "Gemeinde": "Däniken",
        "Longitude": 7.98263022373767,
        "Latitude": 47.3554707307998
      },
      {
        "Gemeinde": "Dulliken",
        "Longitude": 7.94550186558194,
        "Latitude": 47.348444054931
      },
      {
        "Gemeinde": "Eppenberg-Wöschnau",
        "Longitude": 8.02388776139237,
        "Latitude": 47.3759565624462
      },
      {
        "Gemeinde": "Fulenbach",
        "Longitude": 7.83511123403933,
        "Latitude": 47.2751203896211
      },
      {
        "Gemeinde": "Gretzenbach",
        "Longitude": 7.99720832891588,
        "Latitude": 47.3572000444822
      },
      {
        "Gemeinde": "Gunzgen",
        "Longitude": 7.82879885558792,
        "Latitude": 47.3156181351049
      },
      {
        "Gemeinde": "Hägendorf",
        "Longitude": 7.84217411258385,
        "Latitude": 47.3353597690095
      },
      {
        "Gemeinde": "Kappel (SO)",
        "Longitude": 7.8486995515762,
        "Latitude": 47.32364403556
      },
      {
        "Gemeinde": "Olten",
        "Longitude": 7.89789026369705,
        "Latitude": 47.3522410600888
      },
      {
        "Gemeinde": "Rickenbach (SO)",
        "Longitude": 7.85545405451847,
        "Latitude": 47.3416086939134
      },
      {
        "Gemeinde": "Schönenwerd",
        "Longitude": 8.00530286787403,
        "Latitude": 47.3715519604593
      },
      {
        "Gemeinde": "Starrkirch-Wil",
        "Longitude": 7.92568365970902,
        "Latitude": 47.3521271843585
      },
      {
        "Gemeinde": "Walterswil (SO)",
        "Longitude": 7.96114490976652,
        "Latitude": 47.3240884638285
      },
      {
        "Gemeinde": "Wangen bei Olten",
        "Longitude": 7.8687153841299,
        "Latitude": 47.345157828761
      },
      {
        "Gemeinde": "Solothurn",
        "Longitude": 7.52971033815691,
        "Latitude": 47.2101049804871
      },
      {
        "Gemeinde": "Bärschwil",
        "Longitude": 7.47306064214253,
        "Latitude": 47.3819303981035
      },
      {
        "Gemeinde": "Beinwil (SO)",
        "Longitude": 7.58689070473721,
        "Latitude": 47.3620530572459
      },
      {
        "Gemeinde": "Breitenbach",
        "Longitude": 7.54329481627508,
        "Latitude": 47.407072356933
      },
      {
        "Gemeinde": "Büsserach",
        "Longitude": 7.53928978533481,
        "Latitude": 47.3908863247334
      },
      {
        "Gemeinde": "Erschwil",
        "Longitude": 7.54190232465156,
        "Latitude": 47.3719958685373
      },
      {
        "Gemeinde": "Fehren",
        "Longitude": 7.57903797830408,
        "Latitude": 47.3962414335516
      },
      {
        "Gemeinde": "Grindel",
        "Longitude": 7.50219306133564,
        "Latitude": 47.3810187582491
      },
      {
        "Gemeinde": "Himmelried",
        "Longitude": 7.59765719745584,
        "Latitude": 47.421401218057
      },
      {
        "Gemeinde": "Kleinlützel",
        "Longitude": 7.41742401692385,
        "Latitude": 47.4260048477723
      },
      {
        "Gemeinde": "Meltingen",
        "Longitude": 7.58961188185264,
        "Latitude": 47.3881332378881
      },
      {
        "Gemeinde": "Nunningen",
        "Longitude": 7.61876672405703,
        "Latitude": 47.3934881364824
      },
      {
        "Gemeinde": "Zullwil",
        "Longitude": 7.60021516109353,
        "Latitude": 47.3908172397226
      },
      {
        "Gemeinde": "Basel",
        "Longitude": 7.58876641005343,
        "Latitude": 47.559021680656
      },
      {
        "Gemeinde": "Bettingen",
        "Longitude": 7.66587993343202,
        "Latitude": 47.5705888026558
      },
      {
        "Gemeinde": "Riehen",
        "Longitude": 7.64197907434759,
        "Latitude": 47.5760294607204
      },
      {
        "Gemeinde": "Aesch (BL)",
        "Longitude": 7.59646968046003,
        "Latitude": 47.4681725665125
      },
      {
        "Gemeinde": "Allschwil",
        "Longitude": 7.53560506504589,
        "Latitude": 47.5509838880198
      },
      {
        "Gemeinde": "Arlesheim",
        "Longitude": 7.62043375384843,
        "Latitude": 47.4942203050429
      },
      {
        "Gemeinde": "Biel-Benken",
        "Longitude": 7.52756085236933,
        "Latitude": 47.5069201159106
      },
      {
        "Gemeinde": "Binningen",
        "Longitude": 7.57144019743407,
        "Latitude": 47.5374576402527
      },
      {
        "Gemeinde": "Birsfelden",
        "Longitude": 7.62329062945444,
        "Latitude": 47.5526765699999
      },
      {
        "Gemeinde": "Bottmingen",
        "Longitude": 7.57273223504723,
        "Latitude": 47.5230659668038
      },
      {
        "Gemeinde": "Ettingen",
        "Longitude": 7.54476481646012,
        "Latitude": 47.480822941044
      },
      {
        "Gemeinde": "Münchenstein",
        "Longitude": 7.61651567559888,
        "Latitude": 47.5131138154016
      },
      {
        "Gemeinde": "Muttenz",
        "Longitude": 7.63914454130957,
        "Latitude": 47.5292660818544
      },
      {
        "Gemeinde": "Oberwil (BL)",
        "Longitude": 7.55677904457905,
        "Latitude": 47.5140893142429
      },
      {
        "Gemeinde": "Pfeffingen",
        "Longitude": 7.588486131325,
        "Latitude": 47.4591890459707
      },
      {
        "Gemeinde": "Reinach (BL)",
        "Longitude": 7.58990904167919,
        "Latitude": 47.4933647097089
      },
      {
        "Gemeinde": "Schönenbuch",
        "Longitude": 7.50104930722864,
        "Latitude": 47.537516782253
      },
      {
        "Gemeinde": "Therwil",
        "Longitude": 7.55409076747811,
        "Latitude": 47.4988022097451
      },
      {
        "Gemeinde": "Blauen",
        "Longitude": 7.51951156154298,
        "Latitude": 47.4502633642296
      },
      {
        "Gemeinde": "Brislach",
        "Longitude": 7.54331586410569,
        "Latitude": 47.4178654183464
      },
      {
        "Gemeinde": "Burg im Leimental",
        "Longitude": 7.44128093722002,
        "Latitude": 47.4574863639311
      },
      {
        "Gemeinde": "Dittingen",
        "Longitude": 7.4982856057527,
        "Latitude": 47.4403826434767
      },
      {
        "Gemeinde": "Duggingen",
        "Longitude": 7.6043807654642,
        "Latitude": 47.4528715444107
      },
      {
        "Gemeinde": "Grellingen",
        "Longitude": 7.58843844842848,
        "Latitude": 47.4421002287201
      },
      {
        "Gemeinde": "Laufen",
        "Longitude": 7.50091441620054,
        "Latitude": 47.420594143917
      },
      {
        "Gemeinde": "Liesberg",
        "Longitude": 7.42935633580171,
        "Latitude": 47.4035210049787
      },
      {
        "Gemeinde": "Nenzlingen",
        "Longitude": 7.56193786702924,
        "Latitude": 47.4484273257289
      },
      {
        "Gemeinde": "Roggenburg",
        "Longitude": 7.34054011146514,
        "Latitude": 47.4340591748957
      },
      {
        "Gemeinde": "Röschenz",
        "Longitude": 7.47573783521459,
        "Latitude": 47.4242024420593
      },
      {
        "Gemeinde": "Wahlen",
        "Longitude": 7.51546360248188,
        "Latitude": 47.4007982249785
      },
      {
        "Gemeinde": "Zwingen",
        "Longitude": 7.53009484665598,
        "Latitude": 47.435864957372
      },
      {
        "Gemeinde": "Arisdorf",
        "Longitude": 7.76518563704381,
        "Latitude": 47.5109917099208
      },
      {
        "Gemeinde": "Augst",
        "Longitude": 7.7175249821129,
        "Latitude": 47.5353997622969
      },
      {
        "Gemeinde": "Bubendorf",
        "Longitude": 7.73695581923219,
        "Latitude": 47.4481087437627
      },
      {
        "Gemeinde": "Frenkendorf",
        "Longitude": 7.71602758306629,
        "Latitude": 47.5030251407934
      },
      {
        "Gemeinde": "Füllinsdorf",
        "Longitude": 7.72931488398301,
        "Latitude": 47.5056907894088
      },
      {
        "Gemeinde": "Giebenach",
        "Longitude": 7.74534150288749,
        "Latitude": 47.5227380799112
      },
      {
        "Gemeinde": "Hersberg",
        "Longitude": 7.78364737077993,
        "Latitude": 47.4920505328298
      },
      {
        "Gemeinde": "Lausen",
        "Longitude": 7.75964229811718,
        "Latitude": 47.4723324522325
      },
      {
        "Gemeinde": "Liestal",
        "Longitude": 7.73450898580492,
        "Latitude": 47.4849913315449
      },
      {
        "Gemeinde": "Lupsingen",
        "Longitude": 7.69451875249965,
        "Latitude": 47.446411584612
      },
      {
        "Gemeinde": "Pratteln",
        "Longitude": 7.69487843417442,
        "Latitude": 47.5210617739799
      },
      {
        "Gemeinde": "Ramlinsburg",
        "Longitude": 7.76347900607872,
        "Latitude": 47.4489366945784
      },
      {
        "Gemeinde": "Seltisberg",
        "Longitude": 7.71712863459429,
        "Latitude": 47.4598507246686
      },
      {
        "Gemeinde": "Ziefen",
        "Longitude": 7.7076999999911,
        "Latitude": 47.4310914307978
      },
      {
        "Gemeinde": "Anwil",
        "Longitude": 7.9411741580994,
        "Latitude": 47.4509994073346
      },
      {
        "Gemeinde": "Böckten",
        "Longitude": 7.83518482988296,
        "Latitude": 47.4631038869854
      },
      {
        "Gemeinde": "Buckten",
        "Longitude": 7.84538933477606,
        "Latitude": 47.4100020427668
      },
      {
        "Gemeinde": "Buus",
        "Longitude": 7.86470112968723,
        "Latitude": 47.5052716202789
      },
      {
        "Gemeinde": "Diepflingen",
        "Longitude": 7.83770922397603,
        "Latitude": 47.446006122802
      },
      {
        "Gemeinde": "Gelterkinden",
        "Longitude": 7.85508567157396,
        "Latitude": 47.4639334288358
      },
      {
        "Gemeinde": "Häfelfingen",
        "Longitude": 7.86662411111571,
        "Latitude": 47.4144225794942
      },
      {
        "Gemeinde": "Hemmiken",
        "Longitude": 7.89242865713543,
        "Latitude": 47.4880772365441
      },
      {
        "Gemeinde": "Itingen",
        "Longitude": 7.78481043692784,
        "Latitude": 47.4668633211626
      },
      {
        "Gemeinde": "Känerkinden",
        "Longitude": 7.8361282765067,
        "Latitude": 47.4118331309387
      },
      {
        "Gemeinde": "Kilchberg (BL)",
        "Longitude": 7.89852598010734,
        "Latitude": 47.4259927615973
      },
      {
        "Gemeinde": "Läufelfingen",
        "Longitude": 7.85720045149462,
        "Latitude": 47.395568831448
      },
      {
        "Gemeinde": "Maisprach",
        "Longitude": 7.84626365865076,
        "Latitude": 47.5242255686507
      },
      {
        "Gemeinde": "Nusshof",
        "Longitude": 7.80487282049844,
        "Latitude": 47.4910858505599
      },
      {
        "Gemeinde": "Oltingen",
        "Longitude": 7.93436832366331,
        "Latitude": 47.4321407581992
      },
      {
        "Gemeinde": "Ormalingen",
        "Longitude": 7.87635045518123,
        "Latitude": 47.4692515116882
      },
      {
        "Gemeinde": "Rickenbach (BL)",
        "Longitude": 7.85126736761303,
        "Latitude": 47.4846337513948
      },
      {
        "Gemeinde": "Rothenfluh",
        "Longitude": 7.91473575389966,
        "Latitude": 47.4601054905091
      },
      {
        "Gemeinde": "Rümlingen",
        "Longitude": 7.84814298910417,
        "Latitude": 47.4234838766019
      },
      {
        "Gemeinde": "Rünenberg",
        "Longitude": 7.8840003019536,
        "Latitude": 47.4323456623023
      },
      {
        "Gemeinde": "Sissach",
        "Longitude": 7.8113059102281,
        "Latitude": 47.4622838260756
      },
      {
        "Gemeinde": "Tecknau",
        "Longitude": 7.8828248067298,
        "Latitude": 47.4503388629425
      },
      {
        "Gemeinde": "Tenniken",
        "Longitude": 7.81244878562686,
        "Latitude": 47.4361968857722
      },
      {
        "Gemeinde": "Thürnen",
        "Longitude": 7.82982028745843,
        "Latitude": 47.4550273283226
      },
      {
        "Gemeinde": "Wenslingen",
        "Longitude": 7.91057364930053,
        "Latitude": 47.4394357463002
      },
      {
        "Gemeinde": "Wintersingen",
        "Longitude": 7.8247967604289,
        "Latitude": 47.4937192768275
      },
      {
        "Gemeinde": "Wittinsburg",
        "Longitude": 7.84153696678373,
        "Latitude": 47.426205424819
      },
      {
        "Gemeinde": "Zeglingen",
        "Longitude": 7.90507356919306,
        "Latitude": 47.4169721757125
      },
      {
        "Gemeinde": "Zunzgen",
        "Longitude": 7.807233744752,
        "Latitude": 47.4488055041244
      },
      {
        "Gemeinde": "Arboldswil",
        "Longitude": 7.7169033032332,
        "Latitude": 47.4166788614058
      },
      {
        "Gemeinde": "Bennwil",
        "Longitude": 7.78042143256518,
        "Latitude": 47.4030169712382
      },
      {
        "Gemeinde": "Bretzwil",
        "Longitude": 7.65189760232215,
        "Latitude": 47.3979289617265
      },
      {
        "Gemeinde": "Diegten",
        "Longitude": 7.81096609803075,
        "Latitude": 47.4137158454591
      },
      {
        "Gemeinde": "Eptingen",
        "Longitude": 7.82004167484843,
        "Latitude": 47.3858035556385
      },
      {
        "Gemeinde": "Hölstein",
        "Longitude": 7.76995733889339,
        "Latitude": 47.424633887075
      },
      {
        "Gemeinde": "Lampenberg",
        "Longitude": 7.75936045374353,
        "Latitude": 47.4255631627873
      },
      {
        "Gemeinde": "Langenbruck",
        "Longitude": 7.76684186397728,
        "Latitude": 47.3490899826924
      },
      {
        "Gemeinde": "Lauwil",
        "Longitude": 7.67570527498584,
        "Latitude": 47.3897877055807
      },
      {
        "Gemeinde": "Liedertswil",
        "Longitude": 7.71809652216826,
        "Latitude": 47.3914918531344
      },
      {
        "Gemeinde": "Niederdorf",
        "Longitude": 7.75129795845777,
        "Latitude": 47.4066972202981
      },
      {
        "Gemeinde": "Oberdorf (BL)",
        "Longitude": 7.74989441936486,
        "Latitude": 47.3932094965475
      },
      {
        "Gemeinde": "Reigoldswil",
        "Longitude": 7.69163249398454,
        "Latitude": 47.396949413003
      },
      {
        "Gemeinde": "Titterten",
        "Longitude": 7.71682829206632,
        "Latitude": 47.4022881474197
      },
      {
        "Gemeinde": "Waldenburg",
        "Longitude": 7.74585356036726,
        "Latitude": 47.3815276108752
      },
      {
        "Gemeinde": "Gächlingen",
        "Longitude": 8.50049927749073,
        "Latitude": 47.7035561820646
      },
      {
        "Gemeinde": "Löhningen",
        "Longitude": 8.55374742085228,
        "Latitude": 47.7012585146372
      },
      {
        "Gemeinde": "Neunkirch",
        "Longitude": 8.49889698133283,
        "Latitude": 47.6900797115939
      },
      {
        "Gemeinde": "Büttenhardt",
        "Longitude": 8.65362045392933,
        "Latitude": 47.7569204990202
      },
      {
        "Gemeinde": "Dörflingen",
        "Longitude": 8.71909585404475,
        "Latitude": 47.7067492798946
      },
      {
        "Gemeinde": "Lohn (SH)",
        "Longitude": 8.67093457883047,
        "Latitude": 47.7558388979218
      },
      {
        "Gemeinde": "Stetten (SH)",
        "Longitude": 8.66255933896192,
        "Latitude": 47.7397379089501
      },
      {
        "Gemeinde": "Thayngen",
        "Longitude": 8.70674328636574,
        "Latitude": 47.7473591321391
      },
      {
        "Gemeinde": "Bargen (SH)",
        "Longitude": 8.61170703993352,
        "Latitude": 47.7915278038508
      },
      {
        "Gemeinde": "Beringen",
        "Longitude": 8.57500291645658,
        "Latitude": 47.698354305147
      },
      {
        "Gemeinde": "Buchberg",
        "Longitude": 8.56167774621852,
        "Latitude": 47.5725646288812
      },
      {
        "Gemeinde": "Merishausen",
        "Longitude": 8.60836167828615,
        "Latitude": 47.7609820743176
      },
      {
        "Gemeinde": "Neuhausen am Rheinfall",
        "Longitude": 8.6172668112277,
        "Latitude": 47.6817435825588
      },
      {
        "Gemeinde": "Rüdlingen",
        "Longitude": 8.56319713872737,
        "Latitude": 47.5815443562848
      },
      {
        "Gemeinde": "Schaffhausen",
        "Longitude": 8.63229920174163,
        "Latitude": 47.6986791841787
      },
      {
        "Gemeinde": "Beggingen",
        "Longitude": 8.53779287872174,
        "Latitude": 47.7670666020339
      },
      {
        "Gemeinde": "Schleitheim",
        "Longitude": 8.48675323056797,
        "Latitude": 47.7495500036624
      },
      {
        "Gemeinde": "Siblingen",
        "Longitude": 8.52070219798474,
        "Latitude": 47.7141626514064
      },
      {
        "Gemeinde": "Buch (SH)",
        "Longitude": 8.78331162734365,
        "Latitude": 47.716817685154
      },
      {
        "Gemeinde": "Hemishofen",
        "Longitude": 8.83156948995584,
        "Latitude": 47.6766728210142
      },
      {
        "Gemeinde": "Ramsen",
        "Longitude": 8.80972702837028,
        "Latitude": 47.7075144623703
      },
      {
        "Gemeinde": "Stein am Rhein",
        "Longitude": 8.85909467809338,
        "Latitude": 47.660148669793
      },
      {
        "Gemeinde": "Hallau",
        "Longitude": 8.45773123238767,
        "Latitude": 47.6967439510249
      },
      {
        "Gemeinde": "Oberhallau",
        "Longitude": 8.47788769894378,
        "Latitude": 47.7055594202122
      },
      {
        "Gemeinde": "Trasadingen",
        "Longitude": 8.43188332174073,
        "Latitude": 47.6681869372634
      },
      {
        "Gemeinde": "Wilchingen",
        "Longitude": 8.46781046115679,
        "Latitude": 47.6669746573201
      },
      {
        "Gemeinde": "Herisau",
        "Longitude": 9.27576223333101,
        "Latitude": 47.3889135363365
      },
      {
        "Gemeinde": "Hundwil",
        "Longitude": 9.31862970780364,
        "Latitude": 47.364831605132
      },
      {
        "Gemeinde": "Schönengrund",
        "Longitude": 9.22727602074394,
        "Latitude": 47.3257985385463
      },
      {
        "Gemeinde": "Schwellbrunn",
        "Longitude": 9.24932151587001,
        "Latitude": 47.3515451515317
      },
      {
        "Gemeinde": "Stein (AR)",
        "Longitude": 9.344096165287,
        "Latitude": 47.3734105574832
      },
      {
        "Gemeinde": "Urnäsch",
        "Longitude": 9.28521570097708,
        "Latitude": 47.3176879787789
      },
      {
        "Gemeinde": "Waldstatt",
        "Longitude": 9.28523219750356,
        "Latitude": 47.3563741972779
      },
      {
        "Gemeinde": "Bühler",
        "Longitude": 9.41825050566576,
        "Latitude": 47.3730629531707
      },
      {
        "Gemeinde": "Gais",
        "Longitude": 9.45361256950883,
        "Latitude": 47.3625543055492
      },
      {
        "Gemeinde": "Speicher",
        "Longitude": 9.44220486325557,
        "Latitude": 47.4113370409764
      },
      {
        "Gemeinde": "Teufen (AR)",
        "Longitude": 9.38710898314782,
        "Latitude": 47.3906865390335
      },
      {
        "Gemeinde": "Trogen",
        "Longitude": 9.46461895298036,
        "Latitude": 47.4082470099213
      },
      {
        "Gemeinde": "Grub (AR)",
        "Longitude": 9.50993318101729,
        "Latitude": 47.4488304688201
      },
      {
        "Gemeinde": "Heiden",
        "Longitude": 9.53361349356061,
        "Latitude": 47.4439047739195
      },
      {
        "Gemeinde": "Lutzenberg",
        "Longitude": 9.5687194889684,
        "Latitude": 47.4594590284209
      },
      {
        "Gemeinde": "Rehetobel",
        "Longitude": 9.48252687766826,
        "Latitude": 47.425925688341
      },
      {
        "Gemeinde": "Reute (AR)",
        "Longitude": 9.57508309744552,
        "Latitude": 47.4197533519065
      },
      {
        "Gemeinde": "Wald (AR)",
        "Longitude": 9.48877003136098,
        "Latitude": 47.4159182409674
      },
      {
        "Gemeinde": "Walzenhausen",
        "Longitude": 9.60282018389865,
        "Latitude": 47.4498284666081
      },
      {
        "Gemeinde": "Wolfhalden",
        "Longitude": 9.54990995039018,
        "Latitude": 47.4535055327684
      },
      {
        "Gemeinde": "Appenzell",
        "Longitude": 9.410068964599,
        "Latitude": 47.3309163225417
      },
      {
        "Gemeinde": "Gonten",
        "Longitude": 9.35306975851936,
        "Latitude": 47.3282774049908
      },
      {
        "Gemeinde": "Rüte",
        "Longitude": 9.42953730709695,
        "Latitude": 47.3206851795981
      },
      {
        "Gemeinde": "Schlatt-Haslen",
        "Longitude": 9.36779118226084,
        "Latitude": 47.3694180420185
      },
      {
        "Gemeinde": "Schwende",
        "Longitude": 9.43540790521804,
        "Latitude": 47.3007898262064
      },
      {
        "Gemeinde": "Oberegg",
        "Longitude": 9.55134629306643,
        "Latitude": 47.4228885296045
      },
      {
        "Gemeinde": "Häggenschwil",
        "Longitude": 9.34178197269242,
        "Latitude": 47.4940044569223
      },
      {
        "Gemeinde": "Muolen",
        "Longitude": 9.32416576255909,
        "Latitude": 47.5212821553095
      },
      {
        "Gemeinde": "St. Gallen",
        "Longitude": 9.37646785723828,
        "Latitude": 47.4259533459567
      },
      {
        "Gemeinde": "Wittenbach",
        "Longitude": 9.37913750410867,
        "Latitude": 47.462795444428
      },
      {
        "Gemeinde": "Berg (SG)",
        "Longitude": 9.40651857072019,
        "Latitude": 47.4857240254964
      },
      {
        "Gemeinde": "Eggersriet",
        "Longitude": 9.47254633578029,
        "Latitude": 47.442296684478
      },
      {
        "Gemeinde": "Goldach",
        "Longitude": 9.46575985264341,
        "Latitude": 47.4730056091833
      },
      {
        "Gemeinde": "Mörschwil",
        "Longitude": 9.42315784094479,
        "Latitude": 47.4692459516144
      },
      {
        "Gemeinde": "Rorschach",
        "Longitude": 9.49252382840005,
        "Latitude": 47.4788312713422
      },
      {
        "Gemeinde": "Rorschacherberg",
        "Longitude": 9.50934330643454,
        "Latitude": 47.4677350245909
      },
      {
        "Gemeinde": "Steinach",
        "Longitude": 9.44035585108709,
        "Latitude": 47.5031370752298
      },
      {
        "Gemeinde": "Tübach",
        "Longitude": 9.45165000479054,
        "Latitude": 47.4858474894447
      },
      {
        "Gemeinde": "Untereggen",
        "Longitude": 9.4517842164943,
        "Latitude": 47.4543562777328
      },
      {
        "Gemeinde": "Au (SG)",
        "Longitude": 9.63668474795407,
        "Latitude": 47.4347937501537
      },
      {
        "Gemeinde": "Balgach",
        "Longitude": 9.60904728254065,
        "Latitude": 47.4074246039774
      },
      {
        "Gemeinde": "Berneck",
        "Longitude": 9.6124299166643,
        "Latitude": 47.425355398463
      },
      {
        "Gemeinde": "Diepoldsau",
        "Longitude": 9.65582488103053,
        "Latitude": 47.3849422415485
      },
      {
        "Gemeinde": "Rheineck",
        "Longitude": 9.58889572984404,
        "Latitude": 47.4662833877215
      },
      {
        "Gemeinde": "St. Margrethen",
        "Longitude": 9.63345255258084,
        "Latitude": 47.4528498656681
      },
      {
        "Gemeinde": "Thal",
        "Longitude": 9.57026170479906,
        "Latitude": 47.4648289723589
      },
      {
        "Gemeinde": "Widnau",
        "Longitude": 9.63417238420269,
        "Latitude": 47.4060504167805
      },
      {
        "Gemeinde": "Altstätten",
        "Longitude": 9.54029698871595,
        "Latitude": 47.3781042394953
      },
      {
        "Gemeinde": "Eichberg",
        "Longitude": 9.52311263608364,
        "Latitude": 47.3451247340073
      },
      {
        "Gemeinde": "Marbach (SG)",
        "Longitude": 9.56866904399843,
        "Latitude": 47.3919807086733
      },
      {
        "Gemeinde": "Oberriet (SG)",
        "Longitude": 9.56447455619026,
        "Latitude": 47.3200766018775
      },
      {
        "Gemeinde": "Rebstein",
        "Longitude": 9.58355865380614,
        "Latitude": 47.3998029337321
      },
      {
        "Gemeinde": "Rüthi (SG)",
        "Longitude": 9.53832580568102,
        "Latitude": 47.2944624797656
      },
      {
        "Gemeinde": "Buchs (SG)",
        "Longitude": 9.47124482102093,
        "Latitude": 47.1651995832872
      },
      {
        "Gemeinde": "Gams",
        "Longitude": 9.44236945475253,
        "Latitude": 47.2043964946705
      },
      {
        "Gemeinde": "Grabs",
        "Longitude": 9.44287961384189,
        "Latitude": 47.182793222199
      },
      {
        "Gemeinde": "Sennwald",
        "Longitude": 9.50396390953248,
        "Latitude": 47.2608930755524
      },
      {
        "Gemeinde": "Sevelen",
        "Longitude": 9.48409766898844,
        "Latitude": 47.1217823102332
      },
      {
        "Gemeinde": "Wartau",
        "Longitude": 9.48431609521071,
        "Latitude": 47.0929852298095
      },
      {
        "Gemeinde": "Bad Ragaz",
        "Longitude": 9.50195331930178,
        "Latitude": 47.003588731417
      },
      {
        "Gemeinde": "Flums",
        "Longitude": 9.34198385159192,
        "Latitude": 47.091832595214
      },
      {
        "Gemeinde": "Mels",
        "Longitude": 9.41935302566885,
        "Latitude": 47.0464351831537
      },
      {
        "Gemeinde": "Pfäfers",
        "Longitude": 9.50140011529073,
        "Latitude": 46.9892015317727
      },
      {
        "Gemeinde": "Quarten",
        "Longitude": 9.23976510265546,
        "Latitude": 47.1078761614721
      },
      {
        "Gemeinde": "Sargans",
        "Longitude": 9.44046849360711,
        "Latitude": 47.0478687791181
      },
      {
        "Gemeinde": "Vilters-Wangs",
        "Longitude": 9.45143131689675,
        "Latitude": 47.0242818814185
      },
      {
        "Gemeinde": "Walenstadt",
        "Longitude": 9.31280230913952,
        "Latitude": 47.123803885032
      },
      {
        "Gemeinde": "Amden",
        "Longitude": 9.15014666705299,
        "Latitude": 47.1488342114271
      },
      {
        "Gemeinde": "Benken (SG)",
        "Longitude": 9.00522141457551,
        "Latitude": 47.198581670603
      },
      {
        "Gemeinde": "Kaltbrunn",
        "Longitude": 9.02678576473415,
        "Latitude": 47.2135797665313
      },
      {
        "Gemeinde": "Schänis",
        "Longitude": 9.04630692567973,
        "Latitude": 47.160228980265
      },
      {
        "Gemeinde": "Weesen",
        "Longitude": 9.09293744486041,
        "Latitude": 47.1325772716981
      },
      {
        "Gemeinde": "Schmerikon",
        "Longitude": 8.94394154143008,
        "Latitude": 47.225488758764
      },
      {
        "Gemeinde": "Uznach",
        "Longitude": 8.98483860809859,
        "Latitude": 47.2240473432278
      },
      {
        "Gemeinde": "Rapperswil-Jona",
        "Longitude": 8.83715051937677,
        "Latitude": 47.2322327860529
      },
      {
        "Gemeinde": "Gommiswald",
        "Longitude": 9.02333296269458,
        "Latitude": 47.230720913765
      },
      {
        "Gemeinde": "Eschenbach (SG)",
        "Longitude": 8.92189867618393,
        "Latitude": 47.2401686995612
      },
      {
        "Gemeinde": "Ebnat-Kappel",
        "Longitude": 9.12339618387068,
        "Latitude": 47.2625879570169
      },
      {
        "Gemeinde": "Wildhaus-Alt St. Johann",
        "Longitude": 9.28488825184897,
        "Latitude": 47.1935350846984
      },
      {
        "Gemeinde": "Nesslau",
        "Longitude": 9.20008643387771,
        "Latitude": 47.2236546056997
      },
      {
        "Gemeinde": "Hemberg",
        "Longitude": 9.17484901096569,
        "Latitude": 47.3005097133265
      },
      {
        "Gemeinde": "Lichtensteig",
        "Longitude": 9.08697544992077,
        "Latitude": 47.3242908112584
      },
      {
        "Gemeinde": "Oberhelfenschwil",
        "Longitude": 9.11306220234099,
        "Latitude": 47.3545020573607
      },
      {
        "Gemeinde": "Neckertal",
        "Longitude": 9.13581477972688,
        "Latitude": 47.3622664418402
      },
      {
        "Gemeinde": "Wattwil",
        "Longitude": 9.08898021837699,
        "Latitude": 47.3035703647168
      },
      {
        "Gemeinde": "Kirchberg (SG)",
        "Longitude": 9.03930991700027,
        "Latitude": 47.4113244965743
      },
      {
        "Gemeinde": "Lütisburg",
        "Longitude": 9.07855213592584,
        "Latitude": 47.3945812088975
      },
      {
        "Gemeinde": "Mosnang",
        "Longitude": 9.0404990060723,
        "Latitude": 47.3627295758135
      },
      {
        "Gemeinde": "Bütschwil-Ganterschwil",
        "Longitude": 9.07220686923437,
        "Latitude": 47.360485558028
      },
      {
        "Gemeinde": "Degersheim",
        "Longitude": 9.19707749556609,
        "Latitude": 47.3730450307587
      },
      {
        "Gemeinde": "Flawil",
        "Longitude": 9.18646209969139,
        "Latitude": 47.4127907181071
      },
      {
        "Gemeinde": "Jonschwil",
        "Longitude": 9.08741580436795,
        "Latitude": 47.4241423006242
      },
      {
        "Gemeinde": "Oberuzwil",
        "Longitude": 9.12341800892355,
        "Latitude": 47.4308198864836
      },
      {
        "Gemeinde": "Uzwil",
        "Longitude": 9.14243050586752,
        "Latitude": 47.4449349172746
      },
      {
        "Gemeinde": "Niederbüren",
        "Longitude": 9.2041181184328,
        "Latitude": 47.4656003220665
      },
      {
        "Gemeinde": "Niederhelfenschwil",
        "Longitude": 9.18587940538541,
        "Latitude": 47.4757730593331
      },
      {
        "Gemeinde": "Oberbüren",
        "Longitude": 9.16119093193512,
        "Latitude": 47.4509542165271
      },
      {
        "Gemeinde": "Zuzwil (SG)",
        "Longitude": 9.11022553082127,
        "Latitude": 47.4750916874368
      },
      {
        "Gemeinde": "Wil (SG)",
        "Longitude": 9.04347696244762,
        "Latitude": 47.4616438877279
      },
      {
        "Gemeinde": "Andwil (SG)",
        "Longitude": 9.27472598961388,
        "Latitude": 47.4357123546501
      },
      {
        "Gemeinde": "Gaiserwald",
        "Longitude": 9.33665623794574,
        "Latitude": 47.4248148536337
      },
      {
        "Gemeinde": "Gossau (SG)",
        "Longitude": 9.24751845136006,
        "Latitude": 47.415449581785
      },
      {
        "Gemeinde": "Waldkirch",
        "Longitude": 9.28515648155182,
        "Latitude": 47.4688328303062
      },
      {
        "Gemeinde": "Vaz/Obervaz",
        "Longitude": 9.55550529355235,
        "Latitude": 46.7272551414547
      },
      {
        "Gemeinde": "Lantsch/Lenz",
        "Longitude": 9.56292397898873,
        "Latitude": 46.6830223005864
      },
      {
        "Gemeinde": "Schmitten (GR)",
        "Longitude": 9.67166570192482,
        "Latitude": 46.6881433664002
      },
      {
        "Gemeinde": "Albula/Alvra",
        "Longitude": 9.645128413325,
        "Latitude": 46.6787608438081
      },
      {
        "Gemeinde": "Surses",
        "Longitude": 9.59863156188866,
        "Latitude": 46.595060910997
      },
      {
        "Gemeinde": "Bergün Filisur",
        "Longitude": 9.74626024745796,
        "Latitude": 46.6281608482272
      },
      {
        "Gemeinde": "Brusio",
        "Longitude": 10.1262687709427,
        "Latitude": 46.2570866982029
      },
      {
        "Gemeinde": "Poschiavo",
        "Longitude": 10.058182903012,
        "Latitude": 46.3252891319829
      },
      {
        "Gemeinde": "Falera",
        "Longitude": 9.23212845274583,
        "Latitude": 46.8011807530538
      },
      {
        "Gemeinde": "Laax",
        "Longitude": 9.25716293505703,
        "Latitude": 46.8052841723945
      },
      {
        "Gemeinde": "Sagogn",
        "Longitude": 9.25536823071425,
        "Latitude": 46.7909159218727
      },
      {
        "Gemeinde": "Schluein",
        "Longitude": 9.22909080565935,
        "Latitude": 46.7886316069938
      },
      {
        "Gemeinde": "Vals",
        "Longitude": 9.18030188613212,
        "Latitude": 46.6166282480508
      },
      {
        "Gemeinde": "Lumnezia",
        "Longitude": 9.17439940255818,
        "Latitude": 46.7174933406356
      },
      {
        "Gemeinde": "Ilanz/Glion",
        "Longitude": 9.20505099251619,
        "Latitude": 46.7746094470671
      },
      {
        "Gemeinde": "Fürstenau",
        "Longitude": 9.44666238454733,
        "Latitude": 46.7211229068882
      },
      {
        "Gemeinde": "Rothenbrunnen",
        "Longitude": 9.42618963938591,
        "Latitude": 46.76917348805
      },
      {
        "Gemeinde": "Scharans",
        "Longitude": 9.45960370415826,
        "Latitude": 46.717295302292
      },
      {
        "Gemeinde": "Sils im Domleschg",
        "Longitude": 9.45373496411771,
        "Latitude": 46.7003013568892
      },
      {
        "Gemeinde": "Cazis",
        "Longitude": 9.42966349070984,
        "Latitude": 46.7214211831753
      },
      {
        "Gemeinde": "Flerden",
        "Longitude": 9.40805202970452,
        "Latitude": 46.702899850604
      },
      {
        "Gemeinde": "Masein",
        "Longitude": 9.4263188171531,
        "Latitude": 46.701682806932
      },
      {
        "Gemeinde": "Thusis",
        "Longitude": 9.43784937796097,
        "Latitude": 46.6951820754477
      },
      {
        "Gemeinde": "Tschappina",
        "Longitude": 9.38132572990829,
        "Latitude": 46.6871615181854
      },
      {
        "Gemeinde": "Urmein",
        "Longitude": 9.40239769978854,
        "Latitude": 46.6912994325286
      },
      {
        "Gemeinde": "Safiental",
        "Longitude": 9.28277253966013,
        "Latitude": 46.7877774527756
      },
      {
        "Gemeinde": "Domleschg",
        "Longitude": 9.44166050735126,
        "Latitude": 46.7626043012744
      },
      {
        "Gemeinde": "Avers",
        "Longitude": 9.51299056291117,
        "Latitude": 46.4724713393368
      },
      {
        "Gemeinde": "Sufers",
        "Longitude": 9.36669476347775,
        "Latitude": 46.5704327622399
      },
      {
        "Gemeinde": "Andeer",
        "Longitude": 9.42659561183658,
        "Latitude": 46.6026949601235
      },
      {
        "Gemeinde": "Casti-Wergenstein",
        "Longitude": 9.40787559149244,
        "Latitude": 46.6264165108581
      },
      {
        "Gemeinde": "Donat",
        "Longitude": 9.42885995188414,
        "Latitude": 46.6287510480185
      },
      {
        "Gemeinde": "Lohn (GR)",
        "Longitude": 9.42707713771793,
        "Latitude": 46.6512787243089
      },
      {
        "Gemeinde": "Mathon",
        "Longitude": 9.41479706733347,
        "Latitude": 46.6370947241252
      },
      {
        "Gemeinde": "Rongellen",
        "Longitude": 9.44230960114503,
        "Latitude": 46.6744076036115
      },
      {
        "Gemeinde": "Zillis-Reischen",
        "Longitude": 9.44345286093494,
        "Latitude": 46.6347941973839
      },
      {
        "Gemeinde": "Ferrera",
        "Longitude": 9.44313133575763,
        "Latitude": 46.5205186920855
      },
      {
        "Gemeinde": "Rheinwald",
        "Longitude": 9.32303717035124,
        "Latitude": 46.5531680061592
      },
      {
        "Gemeinde": "Bonaduz",
        "Longitude": 9.39893262898282,
        "Latitude": 46.811937121868
      },
      {
        "Gemeinde": "Domat/Ems",
        "Longitude": 9.45092336676771,
        "Latitude": 46.8353288252917
      },
      {
        "Gemeinde": "Rhäzüns",
        "Longitude": 9.39713255380169,
        "Latitude": 46.7984704682273
      },
      {
        "Gemeinde": "Felsberg",
        "Longitude": 9.47757270334706,
        "Latitude": 46.8465542132132
      },
      {
        "Gemeinde": "Flims",
        "Longitude": 9.28446640029505,
        "Latitude": 46.8372387745294
      },
      {
        "Gemeinde": "Tamins",
        "Longitude": 9.40748230710541,
        "Latitude": 46.8306866562855
      },
      {
        "Gemeinde": "Trin",
        "Longitude": 9.36283621684087,
        "Latitude": 46.8287477210819
      },
      {
        "Gemeinde": "Zernez",
        "Longitude": 10.0960264680064,
        "Latitude": 46.7006407496085
      },
      {
        "Gemeinde": "Samnaun",
        "Longitude": 10.3954966016532,
        "Latitude": 46.9606179189601
      },
      {
        "Gemeinde": "Scuol",
        "Longitude": 10.3013349874466,
        "Latitude": 46.7973857771026
      },
      {
        "Gemeinde": "Valsot",
        "Longitude": 10.4259938650091,
        "Latitude": 46.8707091233332
      },
      {
        "Gemeinde": "Bever",
        "Longitude": 9.88917177768976,
        "Latitude": 46.5531743322077
      },
      {
        "Gemeinde": "Celerina/Schlarigna",
        "Longitude": 9.86125338136537,
        "Latitude": 46.5123727149542
      },
      {
        "Gemeinde": "Madulain",
        "Longitude": 9.93632350414223,
        "Latitude": 46.5854497207238
      },
      {
        "Gemeinde": "Pontresina",
        "Longitude": 9.90463320330063,
        "Latitude": 46.4916385371261
      },
      {
        "Gemeinde": "La Punt-Chamues-ch",
        "Longitude": 9.93321782959035,
        "Latitude": 46.5747173871383
      },
      {
        "Gemeinde": "Samedan",
        "Longitude": 9.87133922220544,
        "Latitude": 46.5337574421349
      },
      {
        "Gemeinde": "St. Moritz",
        "Longitude": 9.8384351651093,
        "Latitude": 46.4975574596712
      },
      {
        "Gemeinde": "S-chanf",
        "Longitude": 9.98323462244603,
        "Latitude": 46.6114114376348
      },
      {
        "Gemeinde": "Sils im Engadin/Segl",
        "Longitude": 9.76255096405533,
        "Latitude": 46.4298379657513
      },
      {
        "Gemeinde": "Silvaplana",
        "Longitude": 9.79508826745482,
        "Latitude": 46.4597658614296
      },
      {
        "Gemeinde": "Zuoz",
        "Longitude": 9.95928883143622,
        "Latitude": 46.6020438720143
      },
      {
        "Gemeinde": "Bregaglia",
        "Longitude": 9.58991818886585,
        "Latitude": 46.343253717277
      },
      {
        "Gemeinde": "Buseno",
        "Longitude": 9.10699033538651,
        "Latitude": 46.2722136532416
      },
      {
        "Gemeinde": "Castaneda",
        "Longitude": 9.14152858121779,
        "Latitude": 46.2564027119661
      },
      {
        "Gemeinde": "Rossa",
        "Longitude": 9.12542704260512,
        "Latitude": 46.3646184501213
      },
      {
        "Gemeinde": "Santa Maria in Calanca",
        "Longitude": 9.14434728419231,
        "Latitude": 46.2635585391022
      },
      {
        "Gemeinde": "Lostallo",
        "Longitude": 9.19524768137479,
        "Latitude": 46.3131681878335
      },
      {
        "Gemeinde": "Mesocco",
        "Longitude": 9.23293318820755,
        "Latitude": 46.392660551126
      },
      {
        "Gemeinde": "Soazza",
        "Longitude": 9.22297726322345,
        "Latitude": 46.3667229454715
      },
      {
        "Gemeinde": "Cama",
        "Longitude": 9.17310401306838,
        "Latitude": 46.2703197310514
      },
      {
        "Gemeinde": "Grono",
        "Longitude": 9.14905354797671,
        "Latitude": 46.2481910818416
      },
      {
        "Gemeinde": "Roveredo (GR)",
        "Longitude": 9.13318908139328,
        "Latitude": 46.2385323088069
      },
      {
        "Gemeinde": "San Vittore",
        "Longitude": 9.10853447300649,
        "Latitude": 46.2379995366781
      },
      {
        "Gemeinde": "Calanca",
        "Longitude": 9.11311904021699,
        "Latitude": 46.3027155351019
      },
      {
        "Gemeinde": "Val Müstair",
        "Longitude": 10.4255824751459,
        "Latitude": 46.6033594185385
      },
      {
        "Gemeinde": "Davos",
        "Longitude": 9.8255905572032,
        "Latitude": 46.7975198343351
      },
      {
        "Gemeinde": "Fideris",
        "Longitude": 9.74283013584738,
        "Latitude": 46.9153097638077
      },
      {
        "Gemeinde": "Furna",
        "Longitude": 9.67808092317307,
        "Latitude": 46.9372919155835
      },
      {
        "Gemeinde": "Jenaz",
        "Longitude": 9.71584517719275,
        "Latitude": 46.9293479923891
      },
      {
        "Gemeinde": "Klosters-Serneus",
        "Longitude": 9.87892777616319,
        "Latitude": 46.8755905206875
      },
      {
        "Gemeinde": "Conters im Prättigau",
        "Longitude": 9.79873955783221,
        "Latitude": 46.9024719142322
      },
      {
        "Gemeinde": "Küblis",
        "Longitude": 9.7756347222544,
        "Latitude": 46.9146448561426
      },
      {
        "Gemeinde": "Luzein",
        "Longitude": 9.76537054214496,
        "Latitude": 46.9202533394189
      },
      {
        "Gemeinde": "Chur",
        "Longitude": 9.52758495925608,
        "Latitude": 46.8510501907881
      },
      {
        "Gemeinde": "Churwalden",
        "Longitude": 9.54191695562545,
        "Latitude": 46.7814986092149
      },
      {
        "Gemeinde": "Arosa",
        "Longitude": 9.67539210584149,
        "Latitude": 46.7780612137673
      },
      {
        "Gemeinde": "Tschiertschen-Praden",
        "Longitude": 9.60754200955289,
        "Latitude": 46.8171656113715
      },
      {
        "Gemeinde": "Haldenstein",
        "Longitude": 9.52604605222262,
        "Latitude": 46.8789742506614
      },
      {
        "Gemeinde": "Trimmis",
        "Longitude": 9.56485637500717,
        "Latitude": 46.8980558840406
      },
      {
        "Gemeinde": "Untervaz",
        "Longitude": 9.53452808036164,
        "Latitude": 46.9283107731921
      },
      {
        "Gemeinde": "Zizers",
        "Longitude": 9.56368951677176,
        "Latitude": 46.9349722525845
      },
      {
        "Gemeinde": "Fläsch",
        "Longitude": 9.51333862036383,
        "Latitude": 47.0258795729148
      },
      {
        "Gemeinde": "Jenins",
        "Longitude": 9.55580927455559,
        "Latitude": 47.0017075737015
      },
      {
        "Gemeinde": "Maienfeld",
        "Longitude": 9.53104588232842,
        "Latitude": 47.0075609834848
      },
      {
        "Gemeinde": "Malans",
        "Longitude": 9.57740140927157,
        "Latitude": 46.9824097500844
      },
      {
        "Gemeinde": "Landquart",
        "Longitude": 9.55826120195261,
        "Latitude": 46.9638685582658
      },
      {
        "Gemeinde": "Grüsch",
        "Longitude": 9.64703713401033,
        "Latitude": 46.9810896117429
      },
      {
        "Gemeinde": "Schiers",
        "Longitude": 9.68994082957338,
        "Latitude": 46.9694559287337
      },
      {
        "Gemeinde": "Seewis im Prättigau",
        "Longitude": 9.63685758107525,
        "Latitude": 46.9893842473287
      },
      {
        "Gemeinde": "Breil/Brigels",
        "Longitude": 9.04737611818397,
        "Latitude": 46.7571454153465
      },
      {
        "Gemeinde": "Disentis/Mustér",
        "Longitude": 8.8522049383924,
        "Latitude": 46.7030491998246
      },
      {
        "Gemeinde": "Medel (Lucmagn)",
        "Longitude": 8.8592663687013,
        "Latitude": 46.6732705319121
      },
      {
        "Gemeinde": "Sumvitg",
        "Longitude": 8.9392141820201,
        "Latitude": 46.7280284262572
      },
      {
        "Gemeinde": "Tujetsch",
        "Longitude": 8.76664764909115,
        "Latitude": 46.6806857405204
      },
      {
        "Gemeinde": "Trun",
        "Longitude": 8.98673837307444,
        "Latitude": 46.7426889886549
      },
      {
        "Gemeinde": "Obersaxen Mundaun",
        "Longitude": 9.10069601521395,
        "Latitude": 46.7455841866823
      },
      {
        "Gemeinde": "Aarau",
        "Longitude": 8.0452365619108,
        "Latitude": 47.3902377035804
      },
      {
        "Gemeinde": "Biberstein",
        "Longitude": 8.08127778271134,
        "Latitude": 47.4134286190063
      },
      {
        "Gemeinde": "Buchs (AG)",
        "Longitude": 8.06904411561339,
        "Latitude": 47.3874119124014
      },
      {
        "Gemeinde": "Densbüren",
        "Longitude": 8.05259383139072,
        "Latitude": 47.454059462341
      },
      {
        "Gemeinde": "Erlinsbach (AG)",
        "Longitude": 8.0109076350563,
        "Latitude": 47.4003067882092
      },
      {
        "Gemeinde": "Gränichen",
        "Longitude": 8.1004598227222,
        "Latitude": 47.3575539049804
      },
      {
        "Gemeinde": "Hirschthal",
        "Longitude": 8.05371856439716,
        "Latitude": 47.3218336226708
      },
      {
        "Gemeinde": "Küttigen",
        "Longitude": 8.04817339148246,
        "Latitude": 47.4154068090847
      },
      {
        "Gemeinde": "Muhen",
        "Longitude": 8.05392621522129,
        "Latitude": 47.3398218363876
      },
      {
        "Gemeinde": "Oberentfelden",
        "Longitude": 8.04617173120632,
        "Latitude": 47.3560533228347
      },
      {
        "Gemeinde": "Suhr",
        "Longitude": 8.07944436794741,
        "Latitude": 47.371164367048
      },
      {
        "Gemeinde": "Unterentfelden",
        "Longitude": 8.04364697106051,
        "Latitude": 47.366860119909
      },
      {
        "Gemeinde": "Baden",
        "Longitude": 8.30619150090885,
        "Latitude": 47.4731221897356
      },
      {
        "Gemeinde": "Bellikon",
        "Longitude": 8.3445598632529,
        "Latitude": 47.3891765841359
      },
      {
        "Gemeinde": "Bergdietikon",
        "Longitude": 8.38692226992069,
        "Latitude": 47.3879372554927
      },
      {
        "Gemeinde": "Birmenstorf (AG)",
        "Longitude": 8.24764992743368,
        "Latitude": 47.4618537239846
      },
      {
        "Gemeinde": "Ennetbaden",
        "Longitude": 8.31558034430304,
        "Latitude": 47.4793475657646
      },
      {
        "Gemeinde": "Fislisbach",
        "Longitude": 8.29233554692489,
        "Latitude": 47.4363471954073
      },
      {
        "Gemeinde": "Freienwil",
        "Longitude": 8.32659877797797,
        "Latitude": 47.5035486199962
      },
      {
        "Gemeinde": "Gebenstorf",
        "Longitude": 8.2426168798524,
        "Latitude": 47.4798778424887
      },
      {
        "Gemeinde": "Killwangen",
        "Longitude": 8.35324721472086,
        "Latitude": 47.432283616511
      },
      {
        "Gemeinde": "Künten",
        "Longitude": 8.32999222081443,
        "Latitude": 47.3892900299501
      },
      {
        "Gemeinde": "Mägenwil",
        "Longitude": 8.22966084134345,
        "Latitude": 47.4116085933749
      },
      {
        "Gemeinde": "Mellingen",
        "Longitude": 8.27349600132694,
        "Latitude": 47.4184957151567
      },
      {
        "Gemeinde": "Neuenhof",
        "Longitude": 8.32961548783144,
        "Latitude": 47.445960241819
      },
      {
        "Gemeinde": "Niederrohrdorf",
        "Longitude": 8.30538567114194,
        "Latitude": 47.4236574683528
      },
      {
        "Gemeinde": "Oberrohrdorf",
        "Longitude": 8.31723819314011,
        "Latitude": 47.4190705960302
      },
      {
        "Gemeinde": "Obersiggenthal",
        "Longitude": 8.295811820251,
        "Latitude": 47.4875908388236
      },
      {
        "Gemeinde": "Remetschwil",
        "Longitude": 8.3263337840102,
        "Latitude": 47.4082073370285
      },
      {
        "Gemeinde": "Spreitenbach",
        "Longitude": 8.3649253406024,
        "Latitude": 47.4177991064343
      },
      {
        "Gemeinde": "Stetten (AG)",
        "Longitude": 8.3076395463075,
        "Latitude": 47.399354767705
      },
      {
        "Gemeinde": "Turgi",
        "Longitude": 8.25076873903936,
        "Latitude": 47.4924131335685
      },
      {
        "Gemeinde": "Untersiggenthal",
        "Longitude": 8.25490156609009,
        "Latitude": 47.5022778627712
      },
      {
        "Gemeinde": "Wettingen",
        "Longitude": 8.31804023354216,
        "Latitude": 47.4676359707169
      },
      {
        "Gemeinde": "Wohlenschwil",
        "Longitude": 8.25749806818834,
        "Latitude": 47.4123139710744
      },
      {
        "Gemeinde": "Würenlingen",
        "Longitude": 8.2580002356736,
        "Latitude": 47.5310379733371
      },
      {
        "Gemeinde": "Würenlos",
        "Longitude": 8.36403816024147,
        "Latitude": 47.4429914495618
      },
      {
        "Gemeinde": "Ehrendingen",
        "Longitude": 8.35045722531453,
        "Latitude": 47.5015643114416
      },
      {
        "Gemeinde": "Arni (AG)",
        "Longitude": 8.42007790954605,
        "Latitude": 47.3183977497011
      },
      {
        "Gemeinde": "Berikon",
        "Longitude": 8.37566316321447,
        "Latitude": 47.3502499929871
      },
      {
        "Gemeinde": "Bremgarten (AG)",
        "Longitude": 8.34390253632236,
        "Latitude": 47.3505036157488
      },
      {
        "Gemeinde": "Büttikon",
        "Longitude": 8.26939993780586,
        "Latitude": 47.3258788022248
      },
      {
        "Gemeinde": "Dottikon",
        "Longitude": 8.23984083141311,
        "Latitude": 47.383654721186
      },
      {
        "Gemeinde": "Eggenwil",
        "Longitude": 8.340267241787,
        "Latitude": 47.3703207120029
      },
      {
        "Gemeinde": "Fischbach-Göslikon",
        "Longitude": 8.31112704261332,
        "Latitude": 47.3696454944031
      },
      {
        "Gemeinde": "Hägglingen",
        "Longitude": 8.25446246593509,
        "Latitude": 47.3871501628826
      },
      {
        "Gemeinde": "Jonen",
        "Longitude": 8.39322398019692,
        "Latitude": 47.2961360942087
      },
      {
        "Gemeinde": "Niederwil (AG)",
        "Longitude": 8.2940467833551,
        "Latitude": 47.3778687358041
      },
      {
        "Gemeinde": "Oberlunkhofen",
        "Longitude": 8.39217511657879,
        "Latitude": 47.3114364328499
      },
      {
        "Gemeinde": "Oberwil-Lieli",
        "Longitude": 8.38599442328421,
        "Latitude": 47.3357737046999
      },
      {
        "Gemeinde": "Rudolfstetten-Friedlisberg",
        "Longitude": 8.3799509039062,
        "Latitude": 47.3682049682509
      },
      {
        "Gemeinde": "Sarmenstorf",
        "Longitude": 8.2480033926422,
        "Latitude": 47.3107396542471
      },
      {
        "Gemeinde": "Tägerig",
        "Longitude": 8.27854102581196,
        "Latitude": 47.4022685920298
      },
      {
        "Gemeinde": "Uezwil",
        "Longitude": 8.27585843046457,
        "Latitude": 47.3159377410927
      },
      {
        "Gemeinde": "Unterlunkhofen",
        "Longitude": 8.38177081070026,
        "Latitude": 47.3214165133295
      },
      {
        "Gemeinde": "Villmergen",
        "Longitude": 8.24459333235515,
        "Latitude": 47.3476425029048
      },
      {
        "Gemeinde": "Widen",
        "Longitude": 8.36274145904295,
        "Latitude": 47.3683440299094
      },
      {
        "Gemeinde": "Wohlen (AG)",
        "Longitude": 8.27771876908235,
        "Latitude": 47.3501047121128
      },
      {
        "Gemeinde": "Zufikon",
        "Longitude": 8.35968954420318,
        "Latitude": 47.3449817243729
      },
      {
        "Gemeinde": "Islisberg",
        "Longitude": 8.43999996665757,
        "Latitude": 47.3227241226201
      },
      {
        "Gemeinde": "Auenstein",
        "Longitude": 8.13962450263131,
        "Latitude": 47.4166874894302
      },
      {
        "Gemeinde": "Birr",
        "Longitude": 8.20087271108494,
        "Latitude": 47.4369870260207
      },
      {
        "Gemeinde": "Birrhard",
        "Longitude": 8.24462961199402,
        "Latitude": 47.437589427501
      },
      {
        "Gemeinde": "Bözen",
        "Longitude": 8.08358278805654,
        "Latitude": 47.4943653890665
      },
      {
        "Gemeinde": "Brugg",
        "Longitude": 8.20683702872914,
        "Latitude": 47.4828192715353
      },
      {
        "Gemeinde": "Effingen",
        "Longitude": 8.10343161766638,
        "Latitude": 47.4897557988202
      },
      {
        "Gemeinde": "Elfingen",
        "Longitude": 8.09966347730564,
        "Latitude": 47.5068664424335
      },
      {
        "Gemeinde": "Habsburg",
        "Longitude": 8.18531950789202,
        "Latitude": 47.4622731025578
      },
      {
        "Gemeinde": "Hausen (AG)",
        "Longitude": 8.2118428948909,
        "Latitude": 47.4620985122022
      },
      {
        "Gemeinde": "Lupfig",
        "Longitude": 8.20358844086684,
        "Latitude": 47.4414663397018
      },
      {
        "Gemeinde": "Mandach",
        "Longitude": 8.18517974343066,
        "Latitude": 47.546820596326
      },
      {
        "Gemeinde": "Mönthal",
        "Longitude": 8.1409647916296,
        "Latitude": 47.5183157540869
      },
      {
        "Gemeinde": "Mülligen",
        "Longitude": 8.23962515039108,
        "Latitude": 47.4574122850999
      },
      {
        "Gemeinde": "Remigen",
        "Longitude": 8.18873268568862,
        "Latitude": 47.5162171490483
      },
      {
        "Gemeinde": "Riniken",
        "Longitude": 8.18841552935506,
        "Latitude": 47.4937332921586
      },
      {
        "Gemeinde": "Rüfenach",
        "Longitude": 8.20455944177246,
        "Latitude": 47.5089179630794
      },
      {
        "Gemeinde": "Thalheim (AG)",
        "Longitude": 8.10144345990363,
        "Latitude": 47.4367004336073
      },
      {
        "Gemeinde": "Veltheim (AG)",
        "Longitude": 8.14785043996956,
        "Latitude": 47.4373246851502
      },
      {
        "Gemeinde": "Villigen",
        "Longitude": 8.21542811912925,
        "Latitude": 47.5259348794626
      },
      {
        "Gemeinde": "Villnachern",
        "Longitude": 8.16023155685201,
        "Latitude": 47.4705274069007
      },
      {
        "Gemeinde": "Windisch",
        "Longitude": 8.21341807019884,
        "Latitude": 47.4791776300095
      },
      {
        "Gemeinde": "Bözberg",
        "Longitude": 8.1564222174583,
        "Latitude": 47.4831431444331
      },
      {
        "Gemeinde": "Schinznach",
        "Longitude": 8.1426670784311,
        "Latitude": 47.4463508083468
      },
      {
        "Gemeinde": "Beinwil am See",
        "Longitude": 8.20239766562639,
        "Latitude": 47.2660762390257
      },
      {
        "Gemeinde": "Birrwil",
        "Longitude": 8.19613566419206,
        "Latitude": 47.2904039240116
      },
      {
        "Gemeinde": "Burg (AG)",
        "Longitude": 8.18081943085125,
        "Latitude": 47.2347347437326
      },
      {
        "Gemeinde": "Dürrenäsch",
        "Longitude": 8.15688988295363,
        "Latitude": 47.3212375551061
      },
      {
        "Gemeinde": "Gontenschwil",
        "Longitude": 8.1443192923797,
        "Latitude": 47.2709440467074
      },
      {
        "Gemeinde": "Holziken",
        "Longitude": 8.03652327784452,
        "Latitude": 47.3219239988756
      },
      {
        "Gemeinde": "Leimbach (AG)",
        "Longitude": 8.1694511308314,
        "Latitude": 47.2725864324426
      },
      {
        "Gemeinde": "Leutwil",
        "Longitude": 8.17391111020069,
        "Latitude": 47.3085375581051
      },
      {
        "Gemeinde": "Menziken",
        "Longitude": 8.18753546648976,
        "Latitude": 47.2427868276239
      },
      {
        "Gemeinde": "Oberkulm",
        "Longitude": 8.11956736688418,
        "Latitude": 47.2989769139536
      },
      {
        "Gemeinde": "Reinach (AG)",
        "Longitude": 8.18240281378501,
        "Latitude": 47.2536141024503
      },
      {
        "Gemeinde": "Schlossrued",
        "Longitude": 8.08773709747732,
        "Latitude": 47.2910651251793
      },
      {
        "Gemeinde": "Schmiedrued",
        "Longitude": 8.10721760246932,
        "Latitude": 47.2630698168858
      },
      {
        "Gemeinde": "Schöftland",
        "Longitude": 8.05087706798686,
        "Latitude": 47.3047588037194
      },
      {
        "Gemeinde": "Teufenthal (AG)",
        "Longitude": 8.11730035223475,
        "Latitude": 47.3286729948904
      },
      {
        "Gemeinde": "Unterkulm",
        "Longitude": 8.11573777694045,
        "Latitude": 47.3097931979256
      },
      {
        "Gemeinde": "Zetzwil",
        "Longitude": 8.14979668323395,
        "Latitude": 47.2853021756417
      },
      {
        "Gemeinde": "Eiken",
        "Longitude": 7.98974607392225,
        "Latitude": 47.5317263224891
      },
      {
        "Gemeinde": "Frick",
        "Longitude": 8.02135060083545,
        "Latitude": 47.5072873673723
      },
      {
        "Gemeinde": "Gansingen",
        "Longitude": 8.13464493977223,
        "Latitude": 47.5426383335988
      },
      {
        "Gemeinde": "Gipf-Oberfrick",
        "Longitude": 8.00266291043757,
        "Latitude": 47.4974864640831
      },
      {
        "Gemeinde": "Herznach",
        "Longitude": 8.05280157787382,
        "Latitude": 47.4720470594688
      },
      {
        "Gemeinde": "Hornussen",
        "Longitude": 8.06241391542194,
        "Latitude": 47.4998779400044
      },
      {
        "Gemeinde": "Kaisten",
        "Longitude": 8.04428432621611,
        "Latitude": 47.5395485923097
      },
      {
        "Gemeinde": "Laufenburg",
        "Longitude": 8.06046422594883,
        "Latitude": 47.5601495142108
      },
      {
        "Gemeinde": "Münchwilen (AG)",
        "Longitude": 7.9619209667153,
        "Latitude": 47.5381511465924
      },
      {
        "Gemeinde": "Oberhof",
        "Longitude": 8.00612613936275,
        "Latitude": 47.4489002243312
      },
      {
        "Gemeinde": "Oeschgen",
        "Longitude": 8.01616809026036,
        "Latitude": 47.5190058555468
      },
      {
        "Gemeinde": "Schwaderloch",
        "Longitude": 8.14451646249296,
        "Latitude": 47.5857504917842
      },
      {
        "Gemeinde": "Sisseln",
        "Longitude": 7.98864155755147,
        "Latitude": 47.5533172939167
      },
      {
        "Gemeinde": "Ueken",
        "Longitude": 8.04896678684949,
        "Latitude": 47.4846593380612
      },
      {
        "Gemeinde": "Wittnau",
        "Longitude": 7.974612702295,
        "Latitude": 47.4796312405425
      },
      {
        "Gemeinde": "Wölflinswil",
        "Longitude": 7.99830316177561,
        "Latitude": 47.4615305043368
      },
      {
        "Gemeinde": "Zeihen",
        "Longitude": 8.08468022111153,
        "Latitude": 47.4754711386767
      },
      {
        "Gemeinde": "Mettauertal",
        "Longitude": 8.15215347883498,
        "Latitude": 47.5605200443139
      },
      {
        "Gemeinde": "Ammerswil",
        "Longitude": 8.20785132668435,
        "Latitude": 47.3694807869142
      },
      {
        "Gemeinde": "Boniswil",
        "Longitude": 8.18591302973125,
        "Latitude": 47.3156563434395
      },
      {
        "Gemeinde": "Brunegg",
        "Longitude": 8.21651661519949,
        "Latitude": 47.418893562167
      },
      {
        "Gemeinde": "Dintikon",
        "Longitude": 8.22762963340158,
        "Latitude": 47.3639503854687
      },
      {
        "Gemeinde": "Egliswil",
        "Longitude": 8.18771527839803,
        "Latitude": 47.3498247307636
      },
      {
        "Gemeinde": "Fahrwangen",
        "Longitude": 8.24246977601605,
        "Latitude": 47.2945874761198
      },
      {
        "Gemeinde": "Hallwil",
        "Longitude": 8.17551904397505,
        "Latitude": 47.3292154480662
      },
      {
        "Gemeinde": "Hendschiken",
        "Longitude": 8.21736827691676,
        "Latitude": 47.3865070379975
      },
      {
        "Gemeinde": "Holderbank (AG)",
        "Longitude": 8.16891134834173,
        "Latitude": 47.4264000345393
      },
      {
        "Gemeinde": "Hunzenschwil",
        "Longitude": 8.12466637893945,
        "Latitude": 47.3870949825909
      },
      {
        "Gemeinde": "Lenzburg",
        "Longitude": 8.17370349659125,
        "Latitude": 47.3894916561676
      },
      {
        "Gemeinde": "Meisterschwanden",
        "Longitude": 8.22792773768815,
        "Latitude": 47.2946879881365
      },
      {
        "Gemeinde": "Möriken-Wildegg",
        "Longitude": 8.18201348318247,
        "Latitude": 47.4155229409777
      },
      {
        "Gemeinde": "Niederlenz",
        "Longitude": 8.17651409407077,
        "Latitude": 47.4011668031945
      },
      {
        "Gemeinde": "Othmarsingen",
        "Longitude": 8.21625405791133,
        "Latitude": 47.4009060970603
      },
      {
        "Gemeinde": "Rupperswil",
        "Longitude": 8.12752433358551,
        "Latitude": 47.4032683909835
      },
      {
        "Gemeinde": "Schafisheim",
        "Longitude": 8.14307621985925,
        "Latitude": 47.3770900070976
      },
      {
        "Gemeinde": "Seengen",
        "Longitude": 8.20588021359212,
        "Latitude": 47.324520153527
      },
      {
        "Gemeinde": "Seon",
        "Longitude": 8.15988771036394,
        "Latitude": 47.3473036793641
      },
      {
        "Gemeinde": "Staufen",
        "Longitude": 8.16565908184959,
        "Latitude": 47.3823468085693
      },
      {
        "Gemeinde": "Abtwil",
        "Longitude": 8.35542835316119,
        "Latitude": 47.1741074335649
      },
      {
        "Gemeinde": "Aristau",
        "Longitude": 8.36396787366366,
        "Latitude": 47.286480060407
      },
      {
        "Gemeinde": "Auw",
        "Longitude": 8.36530011887968,
        "Latitude": 47.2109094947535
      },
      {
        "Gemeinde": "Beinwil (Freiamt)",
        "Longitude": 8.345837200014,
        "Latitude": 47.2308540700316
      },
      {
        "Gemeinde": "Besenbüren",
        "Longitude": 8.34458372643577,
        "Latitude": 47.3127197263816
      },
      {
        "Gemeinde": "Bettwil",
        "Longitude": 8.26753202015933,
        "Latitude": 47.2908120313029
      },
      {
        "Gemeinde": "Boswil",
        "Longitude": 8.31263870998746,
        "Latitude": 47.3003732662607
      },
      {
        "Gemeinde": "Bünzen",
        "Longitude": 8.32337971113388,
        "Latitude": 47.3101859272144
      },
      {
        "Gemeinde": "Buttwil",
        "Longitude": 8.31080242684397,
        "Latitude": 47.2689042988846
      },
      {
        "Gemeinde": "Dietwil",
        "Longitude": 8.39189550630337,
        "Latitude": 47.1477240152
      },
      {
        "Gemeinde": "Geltwil",
        "Longitude": 8.32368806461923,
        "Latitude": 47.2490167695938
      },
      {
        "Gemeinde": "Kallern",
        "Longitude": 8.29438816583442,
        "Latitude": 47.3167012545183
      },
      {
        "Gemeinde": "Merenschwand",
        "Longitude": 8.37408517288745,
        "Latitude": 47.2603124085582
      },
      {
        "Gemeinde": "Mühlau",
        "Longitude": 8.38939421741454,
        "Latitude": 47.2296032123213
      },
      {
        "Gemeinde": "Muri (AG)",
        "Longitude": 8.34256060802482,
        "Latitude": 47.271358127679
      },
      {
        "Gemeinde": "Oberrüti",
        "Longitude": 8.39485354643724,
        "Latitude": 47.1656906148189
      },
      {
        "Gemeinde": "Rottenschwil",
        "Longitude": 8.36312896194593,
        "Latitude": 47.3143715739401
      },
      {
        "Gemeinde": "Sins",
        "Longitude": 8.39400042920371,
        "Latitude": 47.1917846326038
      },
      {
        "Gemeinde": "Waltenschwil",
        "Longitude": 8.30393786137329,
        "Latitude": 47.334619820328
      },
      {
        "Gemeinde": "Hellikon",
        "Longitude": 7.92447076260058,
        "Latitude": 47.5095331635335
      },
      {
        "Gemeinde": "Kaiseraugst",
        "Longitude": 7.724194282303,
        "Latitude": 47.5407798371685
      },
      {
        "Gemeinde": "Magden",
        "Longitude": 7.81308799408106,
        "Latitude": 47.5270358472362
      },
      {
        "Gemeinde": "Möhlin",
        "Longitude": 7.84519037546943,
        "Latitude": 47.5575071236088
      },
      {
        "Gemeinde": "Mumpf",
        "Longitude": 7.92081474486384,
        "Latitude": 47.5455246804461
      },
      {
        "Gemeinde": "Obermumpf",
        "Longitude": 7.93793049275942,
        "Latitude": 47.5292629735832
      },
      {
        "Gemeinde": "Olsberg",
        "Longitude": 7.7838400695452,
        "Latitude": 47.5217304245772
      },
      {
        "Gemeinde": "Rheinfelden",
        "Longitude": 7.79600126791347,
        "Latitude": 47.5531721554205
      },
      {
        "Gemeinde": "Schupfart",
        "Longitude": 7.96566461917568,
        "Latitude": 47.5138502089576
      },
      {
        "Gemeinde": "Stein (AG)",
        "Longitude": 7.94869160102085,
        "Latitude": 47.543606537284
      },
      {
        "Gemeinde": "Wallbach",
        "Longitude": 7.90366466518696,
        "Latitude": 47.5590856937353
      },
      {
        "Gemeinde": "Wegenstetten",
        "Longitude": 7.93365367405449,
        "Latitude": 47.4978019279885
      },
      {
        "Gemeinde": "Zeiningen",
        "Longitude": 7.87030218848773,
        "Latitude": 47.541227108118
      },
      {
        "Gemeinde": "Zuzgen",
        "Longitude": 7.900702498445,
        "Latitude": 47.5240210809846
      },
      {
        "Gemeinde": "Aarburg",
        "Longitude": 7.90025735580149,
        "Latitude": 47.3198513217844
      },
      {
        "Gemeinde": "Bottenwil",
        "Longitude": 8.00570855940298,
        "Latitude": 47.2852013408379
      },
      {
        "Gemeinde": "Brittnau",
        "Longitude": 7.94729094456639,
        "Latitude": 47.2584896196412
      },
      {
        "Gemeinde": "Kirchleerau",
        "Longitude": 8.06772770681512,
        "Latitude": 47.2758848155916
      },
      {
        "Gemeinde": "Kölliken",
        "Longitude": 8.02212095622152,
        "Latitude": 47.3354898474959
      },
      {
        "Gemeinde": "Moosleerau",
        "Longitude": 8.0636788241802,
        "Latitude": 47.2687109439349
      },
      {
        "Gemeinde": "Murgenthal",
        "Longitude": 7.83770066495235,
        "Latitude": 47.2679159254215
      },
      {
        "Gemeinde": "Oftringen",
        "Longitude": 7.92138778835667,
        "Latitude": 47.3161668737713
      },
      {
        "Gemeinde": "Reitnau",
        "Longitude": 8.04496490499083,
        "Latitude": 47.2499216898787
      },
      {
        "Gemeinde": "Rothrist",
        "Longitude": 7.87897560972408,
        "Latitude": 47.3055432287281
      },
      {
        "Gemeinde": "Safenwil",
        "Longitude": 7.98360480424031,
        "Latitude": 47.3212863201235
      },
      {
        "Gemeinde": "Staffelbach",
        "Longitude": 8.04534248446129,
        "Latitude": 47.2832006513778
      },
      {
        "Gemeinde": "Strengelbach",
        "Longitude": 7.92897627524113,
        "Latitude": 47.2783573413335
      },
      {
        "Gemeinde": "Uerkheim",
        "Longitude": 8.02445085372755,
        "Latitude": 47.3066949741449
      },
      {
        "Gemeinde": "Vordemwald",
        "Longitude": 7.89853962250551,
        "Latitude": 47.2739854126206
      },
      {
        "Gemeinde": "Wiliberg",
        "Longitude": 8.02270522319902,
        "Latitude": 47.2680264165969
      },
      {
        "Gemeinde": "Zofingen",
        "Longitude": 7.94493835878778,
        "Latitude": 47.2890820212035
      },
      {
        "Gemeinde": "Baldingen",
        "Longitude": 8.3155003868607,
        "Latitude": 47.5549013993943
      },
      {
        "Gemeinde": "Böbikon",
        "Longitude": 8.33275516949817,
        "Latitude": 47.5538699992013
      },
      {
        "Gemeinde": "Böttstein",
        "Longitude": 8.24796644872685,
        "Latitude": 47.5697839813445
      },
      {
        "Gemeinde": "Döttingen",
        "Longitude": 8.25859739776368,
        "Latitude": 47.5697092598163
      },
      {
        "Gemeinde": "Endingen",
        "Longitude": 8.28997079697376,
        "Latitude": 47.5371032467274
      },
      {
        "Gemeinde": "Fisibach",
        "Longitude": 8.40731198740806,
        "Latitude": 47.5622650625577
      },
      {
        "Gemeinde": "Full-Reuenthal",
        "Longitude": 8.20339415789416,
        "Latitude": 47.6123589440056
      },
      {
        "Gemeinde": "Kaiserstuhl",
        "Longitude": 8.41805717225011,
        "Latitude": 47.5684708087444
      },
      {
        "Gemeinde": "Klingnau",
        "Longitude": 8.25474915146768,
        "Latitude": 47.5787306086752
      },
      {
        "Gemeinde": "Koblenz",
        "Longitude": 8.23257191560218,
        "Latitude": 47.6067664202789
      },
      {
        "Gemeinde": "Leibstadt",
        "Longitude": 8.17514010386051,
        "Latitude": 47.5891573834137
      },
      {
        "Gemeinde": "Lengnau (AG)",
        "Longitude": 8.32953967751646,
        "Latitude": 47.5206154287267
      },
      {
        "Gemeinde": "Leuggern",
        "Longitude": 8.21754764561742,
        "Latitude": 47.5798860256444
      },
      {
        "Gemeinde": "Mellikon",
        "Longitude": 8.35291423385109,
        "Latitude": 47.5672041732783
      },
      {
        "Gemeinde": "Rekingen (AG)",
        "Longitude": 8.32239722735401,
        "Latitude": 47.5701395914923
      },
      {
        "Gemeinde": "Rietheim",
        "Longitude": 8.27768504950041,
        "Latitude": 47.6001529426663
      },
      {
        "Gemeinde": "Rümikon",
        "Longitude": 8.37812924105156,
        "Latitude": 47.5652036158937
      },
      {
        "Gemeinde": "Schneisingen",
        "Longitude": 8.36402608582811,
        "Latitude": 47.5185461865137
      },
      {
        "Gemeinde": "Siglistorf",
        "Longitude": 8.38043533318375,
        "Latitude": 47.5453970988256
      },
      {
        "Gemeinde": "Tegerfelden",
        "Longitude": 8.28634549863819,
        "Latitude": 47.559615808999
      },
      {
        "Gemeinde": "Wislikofen",
        "Longitude": 8.36073064071461,
        "Latitude": 47.5581478273252
      },
      {
        "Gemeinde": "Bad Zurzach",
        "Longitude": 8.29608162166795,
        "Latitude": 47.586527081285
      },
      {
        "Gemeinde": "Arbon",
        "Longitude": 9.43007819185952,
        "Latitude": 47.5123110173338
      },
      {
        "Gemeinde": "Dozwil",
        "Longitude": 9.31947061716111,
        "Latitude": 47.5762354824611
      },
      {
        "Gemeinde": "Egnach",
        "Longitude": 9.37801275270365,
        "Latitude": 47.5410843580132
      },
      {
        "Gemeinde": "Hefenhofen",
        "Longitude": 9.29913065126136,
        "Latitude": 47.5648689130783
      },
      {
        "Gemeinde": "Horn",
        "Longitude": 9.46260356111219,
        "Latitude": 47.4946531495021
      },
      {
        "Gemeinde": "Kesswil",
        "Longitude": 9.31741822917306,
        "Latitude": 47.5933619450471
      },
      {
        "Gemeinde": "Roggwil (TG)",
        "Longitude": 9.39507767686814,
        "Latitude": 47.4994131171809
      },
      {
        "Gemeinde": "Romanshorn",
        "Longitude": 9.37757144335815,
        "Latitude": 47.5653821132039
      },
      {
        "Gemeinde": "Salmsach",
        "Longitude": 9.37056935990533,
        "Latitude": 47.555603050211
      },
      {
        "Gemeinde": "Sommeri",
        "Longitude": 9.28989448807245,
        "Latitude": 47.5668160171905
      },
      {
        "Gemeinde": "Uttwil",
        "Longitude": 9.34098792981475,
        "Latitude": 47.5830817354333
      },
      {
        "Gemeinde": "Amriswil",
        "Longitude": 9.29843774662305,
        "Latitude": 47.5450883889941
      },
      {
        "Gemeinde": "Bischofszell",
        "Longitude": 9.24351691986921,
        "Latitude": 47.4928803628615
      },
      {
        "Gemeinde": "Erlen",
        "Longitude": 9.23342882882412,
        "Latitude": 47.5479132310612
      },
      {
        "Gemeinde": "Hauptwil-Gottshaus",
        "Longitude": 9.28334652645567,
        "Latitude": 47.4931517008591
      },
      {
        "Gemeinde": "Hohentannen",
        "Longitude": 9.22416050804197,
        "Latitude": 47.5093737170599
      },
      {
        "Gemeinde": "Kradolf-Schönenberg",
        "Longitude": 9.19951273917546,
        "Latitude": 47.526843780466
      },
      {
        "Gemeinde": "Sulgen",
        "Longitude": 9.18529464959797,
        "Latitude": 47.5387537754565
      },
      {
        "Gemeinde": "Zihlschlacht-Sitterdorf",
        "Longitude": 9.24925196535973,
        "Latitude": 47.5053853398575
      },
      {
        "Gemeinde": "Basadingen-Schlattingen",
        "Longitude": 8.74746877876534,
        "Latitude": 47.6686565909748
      },
      {
        "Gemeinde": "Diessenhofen",
        "Longitude": 8.75059896752239,
        "Latitude": 47.6875093905995
      },
      {
        "Gemeinde": "Schlatt (TG)",
        "Longitude": 8.70334550064019,
        "Latitude": 47.6610507081785
      },
      {
        "Gemeinde": "Aadorf",
        "Longitude": 8.90894804942477,
        "Latitude": 47.4895192746841
      },
      {
        "Gemeinde": "Felben-Wellhausen",
        "Longitude": 8.943359341235,
        "Latitude": 47.5799297450075
      },
      {
        "Gemeinde": "Frauenfeld",
        "Longitude": 8.89487520216903,
        "Latitude": 47.5571617766451
      },
      {
        "Gemeinde": "Gachnang",
        "Longitude": 8.85316864462432,
        "Latitude": 47.5378889311213
      },
      {
        "Gemeinde": "Hüttlingen",
        "Longitude": 8.98051681114972,
        "Latitude": 47.5776425404494
      },
      {
        "Gemeinde": "Matzingen",
        "Longitude": 8.93368781732932,
        "Latitude": 47.5197868343009
      },
      {
        "Gemeinde": "Neunforn",
        "Longitude": 8.76854203048788,
        "Latitude": 47.6063539912
      },
      {
        "Gemeinde": "Stettfurt",
        "Longitude": 8.95505490609323,
        "Latitude": 47.52400641275
      },
      {
        "Gemeinde": "Thundorf",
        "Longitude": 8.98770197901178,
        "Latitude": 47.5505602383414
      },
      {
        "Gemeinde": "Uesslingen-Buch",
        "Longitude": 8.83751640594288,
        "Latitude": 47.5992453400339
      },
      {
        "Gemeinde": "Warth-Weiningen",
        "Longitude": 8.87302206928099,
        "Latitude": 47.5844196111495
      },
      {
        "Gemeinde": "Altnau",
        "Longitude": 9.25813111364674,
        "Latitude": 47.60960023195
      },
      {
        "Gemeinde": "Bottighofen",
        "Longitude": 9.20590687050511,
        "Latitude": 47.6391938063567
      },
      {
        "Gemeinde": "Ermatingen",
        "Longitude": 9.08443549319296,
        "Latitude": 47.6706646439227
      },
      {
        "Gemeinde": "Gottlieben",
        "Longitude": 9.1348169344293,
        "Latitude": 47.6636425694939
      },
      {
        "Gemeinde": "Güttingen",
        "Longitude": 9.28719280044195,
        "Latitude": 47.6037430210025
      },
      {
        "Gemeinde": "Kemmental",
        "Longitude": 9.11546552880229,
        "Latitude": 47.5991570179502
      },
      {
        "Gemeinde": "Kreuzlingen",
        "Longitude": 9.1702231839977,
        "Latitude": 47.6469281582513
      },
      {
        "Gemeinde": "Langrickenbach",
        "Longitude": 9.24827199602051,
        "Latitude": 47.5935618911161
      },
      {
        "Gemeinde": "Lengwil",
        "Longitude": 9.19457938943917,
        "Latitude": 47.6186758373824
      },
      {
        "Gemeinde": "Münsterlingen",
        "Longitude": 9.22688834029673,
        "Latitude": 47.6298768424392
      },
      {
        "Gemeinde": "Tägerwilen",
        "Longitude": 9.13319836211669,
        "Latitude": 47.6546708909025
      },
      {
        "Gemeinde": "Wäldi",
        "Longitude": 9.09529108882805,
        "Latitude": 47.634529019025
      },
      {
        "Gemeinde": "Affeltrangen",
        "Longitude": 9.03085708199069,
        "Latitude": 47.5274864529711
      },
      {
        "Gemeinde": "Bettwiesen",
        "Longitude": 9.02596009063928,
        "Latitude": 47.4969689662613
      },
      {
        "Gemeinde": "Bichelsee-Balterswil",
        "Longitude": 8.93844657149656,
        "Latitude": 47.4531586530686
      },
      {
        "Gemeinde": "Braunau",
        "Longitude": 9.07259294068894,
        "Latitude": 47.5026167851079
      },
      {
        "Gemeinde": "Eschlikon",
        "Longitude": 8.97062704044958,
        "Latitude": 47.4653305566906
      },
      {
        "Gemeinde": "Fischingen",
        "Longitude": 8.96915202100041,
        "Latitude": 47.4140746843004
      },
      {
        "Gemeinde": "Lommis",
        "Longitude": 8.97494169164896,
        "Latitude": 47.5228446618767
      },
      {
        "Gemeinde": "Münchwilen (TG)",
        "Longitude": 8.99754307660418,
        "Latitude": 47.4784643738833
      },
      {
        "Gemeinde": "Rickenbach (TG)",
        "Longitude": 9.05105097023281,
        "Latitude": 47.448944209115
      },
      {
        "Gemeinde": "Schönholzerswilen",
        "Longitude": 9.14072702294511,
        "Latitude": 47.5160281710517
      },
      {
        "Gemeinde": "Sirnach",
        "Longitude": 9.0139331153237,
        "Latitude": 47.4494560723732
      },
      {
        "Gemeinde": "Tobel-Tägerschen",
        "Longitude": 9.03316110000853,
        "Latitude": 47.5157604342729
      },
      {
        "Gemeinde": "Wängi",
        "Longitude": 8.95293269054437,
        "Latitude": 47.4961484407542
      },
      {
        "Gemeinde": "Wilen (TG)",
        "Longitude": 9.03389849642504,
        "Latitude": 47.4518809266429
      },
      {
        "Gemeinde": "Wuppenau",
        "Longitude": 9.10692410711161,
        "Latitude": 47.4967297709507
      },
      {
        "Gemeinde": "Berlingen",
        "Longitude": 9.01920803575351,
        "Latitude": 47.6715712470697
      },
      {
        "Gemeinde": "Eschenz",
        "Longitude": 8.87341888959758,
        "Latitude": 47.6482790562225
      },
      {
        "Gemeinde": "Herdern",
        "Longitude": 8.90947966075383,
        "Latitude": 47.6046512892971
      },
      {
        "Gemeinde": "Homburg",
        "Longitude": 9.00743977907444,
        "Latitude": 47.63395105498
      },
      {
        "Gemeinde": "Hüttwilen",
        "Longitude": 8.87097115414618,
        "Latitude": 47.6069326267918
      },
      {
        "Gemeinde": "Mammern",
        "Longitude": 8.91595065011927,
        "Latitude": 47.6459462463362
      },
      {
        "Gemeinde": "Müllheim",
        "Longitude": 9.0025204694101,
        "Latitude": 47.6025344951192
      },
      {
        "Gemeinde": "Pfyn",
        "Longitude": 8.95445329452309,
        "Latitude": 47.5959765845906
      },
      {
        "Gemeinde": "Raperswilen",
        "Longitude": 9.04199881635809,
        "Latitude": 47.6325790639295
      },
      {
        "Gemeinde": "Salenstein",
        "Longitude": 9.05908862066926,
        "Latitude": 47.6692220245235
      },
      {
        "Gemeinde": "Steckborn",
        "Longitude": 8.98036731019019,
        "Latitude": 47.6639982525891
      },
      {
        "Gemeinde": "Wagenhausen",
        "Longitude": 8.84027045186004,
        "Latitude": 47.6531817774753
      },
      {
        "Gemeinde": "Amlikon-Bissegg",
        "Longitude": 9.05872571451523,
        "Latitude": 47.5702787100404
      },
      {
        "Gemeinde": "Berg (TG)",
        "Longitude": 9.16666506204857,
        "Latitude": 47.5786147288991
      },
      {
        "Gemeinde": "Birwinken",
        "Longitude": 9.19734652121239,
        "Latitude": 47.5817514348019
      },
      {
        "Gemeinde": "Bürglen (TG)",
        "Longitude": 9.15244752295964,
        "Latitude": 47.5500393935976
      },
      {
        "Gemeinde": "Bussnang",
        "Longitude": 9.07829442211003,
        "Latitude": 47.5583090856627
      },
      {
        "Gemeinde": "Märstetten",
        "Longitude": 9.06871656966815,
        "Latitude": 47.5926274141954
      },
      {
        "Gemeinde": "Weinfelden",
        "Longitude": 9.10912892542364,
        "Latitude": 47.5668644467822
      },
      {
        "Gemeinde": "Wigoltingen",
        "Longitude": 9.03030441343163,
        "Latitude": 47.5976588028078
      },
      {
        "Gemeinde": "Arbedo-Castione",
        "Longitude": 9.04425379349077,
        "Latitude": 46.2128378510596
      },
      {
        "Gemeinde": "Bellinzona",
        "Longitude": 9.0241920140029,
        "Latitude": 46.1915272675837
      },
      {
        "Gemeinde": "Cadenazzo",
        "Longitude": 8.94922539628039,
        "Latitude": 46.151166981269
      },
      {
        "Gemeinde": "Isone",
        "Longitude": 8.98614103727138,
        "Latitude": 46.1290729410864
      },
      {
        "Gemeinde": "Lumino",
        "Longitude": 9.06551989461711,
        "Latitude": 46.2305288769377
      },
      {
        "Gemeinde": "Sant'Antonino",
        "Longitude": 8.97906609583918,
        "Latitude": 46.1534629399249
      },
      {
        "Gemeinde": "Acquarossa",
        "Longitude": 8.93054225053665,
        "Latitude": 46.461824664737
      },
      {
        "Gemeinde": "Blenio",
        "Longitude": 8.94022113743088,
        "Latitude": 46.5291772175543
      },
      {
        "Gemeinde": "Serravalle",
        "Longitude": 8.98242033424039,
        "Latitude": 46.4089456656451
      },
      {
        "Gemeinde": "Airolo",
        "Longitude": 8.60910040624243,
        "Latitude": 46.5285710182796
      },
      {
        "Gemeinde": "Bedretto",
        "Longitude": 8.51089315588339,
        "Latitude": 46.5061493805174
      },
      {
        "Gemeinde": "Bodio",
        "Longitude": 8.91262392908517,
        "Latitude": 46.377483654732
      },
      {
        "Gemeinde": "Dalpe",
        "Longitude": 8.77459658770246,
        "Latitude": 46.4736647370298
      },
      {
        "Gemeinde": "Faido",
        "Longitude": 8.80076895866667,
        "Latitude": 46.4787520686871
      },
      {
        "Gemeinde": "Giornico",
        "Longitude": 8.8768803743445,
        "Latitude": 46.4022358898799
      },
      {
        "Gemeinde": "Personico",
        "Longitude": 8.9176017344573,
        "Latitude": 46.3693209244779
      },
      {
        "Gemeinde": "Pollegio",
        "Longitude": 8.94346348390006,
        "Latitude": 46.3644818230966
      },
      {
        "Gemeinde": "Prato (Leventina)",
        "Longitude": 8.75789152592751,
        "Latitude": 46.4828568792338
      },
      {
        "Gemeinde": "Quinto",
        "Longitude": 8.71167253119196,
        "Latitude": 46.5112738927153
      },
      {
        "Gemeinde": "Ascona",
        "Longitude": 8.77067343628906,
        "Latitude": 46.1552150511244
      },
      {
        "Gemeinde": "Brione (Verzasca)",
        "Longitude": 8.79102554341186,
        "Latitude": 46.2971259060871
      },
      {
        "Gemeinde": "Brione sopra Minusio",
        "Longitude": 8.81540516270753,
        "Latitude": 46.1834691939726
      },
      {
        "Gemeinde": "Brissago",
        "Longitude": 8.71027630317567,
        "Latitude": 46.1190236902193
      },
      {
        "Gemeinde": "Corippo",
        "Longitude": 8.8400795069369,
        "Latitude": 46.2362483126795
      },
      {
        "Gemeinde": "Frasco",
        "Longitude": 8.8024680567696,
        "Latitude": 46.3392754633438
      },
      {
        "Gemeinde": "Gordola",
        "Longitude": 8.86329370439156,
        "Latitude": 46.181975569096
      },
      {
        "Gemeinde": "Lavertezzo",
        "Longitude": 8.84063566249149,
        "Latitude": 46.2578343787926
      },
      {
        "Gemeinde": "Locarno",
        "Longitude": 8.79428333520344,
        "Latitude": 46.1675299595572
      },
      {
        "Gemeinde": "Losone",
        "Longitude": 8.76185380414002,
        "Latitude": 46.1652156066378
      },
      {
        "Gemeinde": "Mergoscia",
        "Longitude": 8.84715815364457,
        "Latitude": 46.2091695675495
      },
      {
        "Gemeinde": "Minusio",
        "Longitude": 8.81526879099342,
        "Latitude": 46.1780725726927
      },
      {
        "Gemeinde": "Muralto",
        "Longitude": 8.8060922962267,
        "Latitude": 46.1736855176651
      },
      {
        "Gemeinde": "Orselina",
        "Longitude": 8.80107096535529,
        "Latitude": 46.1800442123964
      },
      {
        "Gemeinde": "Ronco sopra Ascona",
        "Longitude": 8.7263919076657,
        "Latitude": 46.1440326413148
      },
      {
        "Gemeinde": "Sonogno",
        "Longitude": 8.78585298465554,
        "Latitude": 46.3502709323383
      },
      {
        "Gemeinde": "Tenero-Contra",
        "Longitude": 8.84770848982402,
        "Latitude": 46.1803716434724
      },
      {
        "Gemeinde": "Vogorno",
        "Longitude": 8.85916996004187,
        "Latitude": 46.2225145179342
      },
      {
        "Gemeinde": "Onsernone",
        "Longitude": 8.62151217626454,
        "Latitude": 46.2018605486044
      },
      {
        "Gemeinde": "Cugnasco-Gerra",
        "Longitude": 8.91748249249451,
        "Latitude": 46.1740810078409
      },
      {
        "Gemeinde": "Agno",
        "Longitude": 8.89849220640953,
        "Latitude": 45.9970835839106
      },
      {
        "Gemeinde": "Aranno",
        "Longitude": 8.87062060245849,
        "Latitude": 46.0172352658913
      },
      {
        "Gemeinde": "Arogno",
        "Longitude": 8.98780399705118,
        "Latitude": 45.9598991588657
      },
      {
        "Gemeinde": "Astano",
        "Longitude": 8.81626402016269,
        "Latitude": 46.0125155154225
      },
      {
        "Gemeinde": "Bedano",
        "Longitude": 8.91802056305608,
        "Latitude": 46.0508108839399
      },
      {
        "Gemeinde": "Bedigliora",
        "Longitude": 8.84182655945904,
        "Latitude": 46.002303153584
      },
      {
        "Gemeinde": "Bioggio",
        "Longitude": 8.90796117968301,
        "Latitude": 46.0131552086566
      },
      {
        "Gemeinde": "Bissone",
        "Longitude": 8.96568017850607,
        "Latitude": 45.9530041234398
      },
      {
        "Gemeinde": "Brusino Arsizio",
        "Longitude": 8.93919997226418,
        "Latitude": 45.928168763138
      },
      {
        "Gemeinde": "Cademario",
        "Longitude": 8.89397753084312,
        "Latitude": 46.0214341932512
      },
      {
        "Gemeinde": "Cadempino",
        "Longitude": 8.93563595276347,
        "Latitude": 46.0334838808855
      },
      {
        "Gemeinde": "Canobbio",
        "Longitude": 8.96667768113987,
        "Latitude": 46.0348661742974
      },
      {
        "Gemeinde": "Caslano",
        "Longitude": 8.88107463861457,
        "Latitude": 45.9730159256869
      },
      {
        "Gemeinde": "Comano",
        "Longitude": 8.95508040091184,
        "Latitude": 46.0359226013057
      },
      {
        "Gemeinde": "Croglio",
        "Longitude": 8.83770101842578,
        "Latitude": 45.9924579558473
      },
      {
        "Gemeinde": "Cureglia",
        "Longitude": 8.94477435159603,
        "Latitude": 46.0369608015902
      },
      {
        "Gemeinde": "Curio",
        "Longitude": 8.86376654164684,
        "Latitude": 46.0020273386185
      },
      {
        "Gemeinde": "Grancia",
        "Longitude": 8.92867877941261,
        "Latitude": 45.9678960394121
      },
      {
        "Gemeinde": "Gravesano",
        "Longitude": 8.9164852899879,
        "Latitude": 46.0418340869306
      },
      {
        "Gemeinde": "Lamone",
        "Longitude": 8.93337349763581,
        "Latitude": 46.0452100338912
      },
      {
        "Gemeinde": "Lugano",
        "Longitude": 8.95033458385614,
        "Latitude": 46.0044961911128
      },
      {
        "Gemeinde": "Magliaso",
        "Longitude": 8.88910056815073,
        "Latitude": 45.9837093074807
      },
      {
        "Gemeinde": "Manno",
        "Longitude": 8.91887317111832,
        "Latitude": 46.0346052597464
      },
      {
        "Gemeinde": "Maroggia",
        "Longitude": 8.97033403520253,
        "Latitude": 45.9349463933539
      },
      {
        "Gemeinde": "Massagno",
        "Longitude": 8.94154754125606,
        "Latitude": 46.013611030055
      },
      {
        "Gemeinde": "Melano",
        "Longitude": 8.98665818739046,
        "Latitude": 45.9194271187305
      },
      {
        "Gemeinde": "Melide",
        "Longitude": 8.94636351604048,
        "Latitude": 45.9541645631001
      },
      {
        "Gemeinde": "Mezzovico-Vira",
        "Longitude": 8.91780024798062,
        "Latitude": 46.0904022201212
      },
      {
        "Gemeinde": "Miglieglia",
        "Longitude": 8.8578980633519,
        "Latitude": 46.0245938440062
      },
      {
        "Gemeinde": "Monteggio",
        "Longitude": 8.80673220180791,
        "Latitude": 45.9928389424186
      },
      {
        "Gemeinde": "Morcote",
        "Longitude": 8.90824335671089,
        "Latitude": 45.9276780084052
      },
      {
        "Gemeinde": "Muzzano",
        "Longitude": 8.92303592382623,
        "Latitude": 45.9976618566724
      },
      {
        "Gemeinde": "Neggio",
        "Longitude": 8.87887388442414,
        "Latitude": 45.9874395873648
      },
      {
        "Gemeinde": "Novaggio",
        "Longitude": 8.854942592782,
        "Latitude": 46.0102361473336
      },
      {
        "Gemeinde": "Origlio",
        "Longitude": 8.94395397929055,
        "Latitude": 46.0540664309865
      },
      {
        "Gemeinde": "Paradiso",
        "Longitude": 8.94480026591456,
        "Latitude": 45.9910741789214
      },
      {
        "Gemeinde": "Ponte Capriasca",
        "Longitude": 8.95063691965715,
        "Latitude": 46.0620744665582
      },
      {
        "Gemeinde": "Ponte Tresa",
        "Longitude": 8.85902894287367,
        "Latitude": 45.9687983157778
      },
      {
        "Gemeinde": "Porza",
        "Longitude": 8.95356434879437,
        "Latitude": 46.0278454626761
      },
      {
        "Gemeinde": "Pura",
        "Longitude": 8.86977144798817,
        "Latitude": 45.9848565521443
      },
      {
        "Gemeinde": "Rovio",
        "Longitude": 8.98832886572304,
        "Latitude": 45.932899612557
      },
      {
        "Gemeinde": "Savosa",
        "Longitude": 8.94951654542721,
        "Latitude": 46.0216017896217
      },
      {
        "Gemeinde": "Sessa",
        "Longitude": 8.8185274684164,
        "Latitude": 45.9998922390306
      },
      {
        "Gemeinde": "Sorengo",
        "Longitude": 8.93462541157051,
        "Latitude": 45.996608469945
      },
      {
        "Gemeinde": "Capriasca",
        "Longitude": 8.96629148394466,
        "Latitude": 46.0672615446437
      },
      {
        "Gemeinde": "Torricella-Taverne",
        "Longitude": 8.93133092883284,
        "Latitude": 46.0650312393874
      },
      {
        "Gemeinde": "Vernate",
        "Longitude": 8.88551576636434,
        "Latitude": 45.9945521175487
      },
      {
        "Gemeinde": "Vezia",
        "Longitude": 8.93792204576894,
        "Latitude": 46.0226566999458
      },
      {
        "Gemeinde": "Vico Morcote",
        "Longitude": 8.92120488460045,
        "Latitude": 45.9302068721935
      },
      {
        "Gemeinde": "Collina d'Oro",
        "Longitude": 8.91746003204044,
        "Latitude": 45.9824399261204
      },
      {
        "Gemeinde": "Alto Malcantone",
        "Longitude": 8.90115558256068,
        "Latitude": 46.0483318750078
      },
      {
        "Gemeinde": "Monteceneri",
        "Longitude": 8.92114339927013,
        "Latitude": 46.1182495900232
      },
      {
        "Gemeinde": "Balerna",
        "Longitude": 9.00655401619493,
        "Latitude": 45.8489720659789
      },
      {
        "Gemeinde": "Castel San Pietro",
        "Longitude": 9.00822759528123,
        "Latitude": 45.862444364692
      },
      {
        "Gemeinde": "Chiasso",
        "Longitude": 9.02675412229097,
        "Latitude": 45.8351920697905
      },
      {
        "Gemeinde": "Coldrerio",
        "Longitude": 8.98737667006821,
        "Latitude": 45.8537371074857
      },
      {
        "Gemeinde": "Mendrisio",
        "Longitude": 8.98397233234221,
        "Latitude": 45.8699789317869
      },
      {
        "Gemeinde": "Morbio Inferiore",
        "Longitude": 9.01697922990547,
        "Latitude": 45.8533243473249
      },
      {
        "Gemeinde": "Novazzano",
        "Longitude": 8.98187346044539,
        "Latitude": 45.8412168155196
      },
      {
        "Gemeinde": "Riva San Vitale",
        "Longitude": 8.9695286133191,
        "Latitude": 45.9061657965642
      },
      {
        "Gemeinde": "Stabio",
        "Longitude": 8.93836864292905,
        "Latitude": 45.8508042640839
      },
      {
        "Gemeinde": "Vacallo",
        "Longitude": 9.03484067161198,
        "Latitude": 45.8476733002535
      },
      {
        "Gemeinde": "Breggia",
        "Longitude": 9.02107428666855,
        "Latitude": 45.8613640796641
      },
      {
        "Gemeinde": "Biasca",
        "Longitude": 8.97064534941043,
        "Latitude": 46.360518447649
      },
      {
        "Gemeinde": "Riviera",
        "Longitude": 8.97935350778292,
        "Latitude": 46.3010167489057
      },
      {
        "Gemeinde": "Bosco/Gurin",
        "Longitude": 8.49156912368318,
        "Latitude": 46.3165018478346
      },
      {
        "Gemeinde": "Campo (Vallemaggia)",
        "Longitude": 8.49492181273863,
        "Latitude": 46.2885816746984
      },
      {
        "Gemeinde": "Cerentino",
        "Longitude": 8.54587151928068,
        "Latitude": 46.3051878706817
      },
      {
        "Gemeinde": "Cevio",
        "Longitude": 8.60063183206915,
        "Latitude": 46.3163348056504
      },
      {
        "Gemeinde": "Linescio",
        "Longitude": 8.58358552591732,
        "Latitude": 46.3084114274106
      },
      {
        "Gemeinde": "Maggia",
        "Longitude": 8.70807527970707,
        "Latitude": 46.2468048333676
      },
      {
        "Gemeinde": "Lavizzara",
        "Longitude": 8.66042352158272,
        "Latitude": 46.3768850345854
      },
      {
        "Gemeinde": "Avegno Gordevio",
        "Longitude": 8.74392278841831,
        "Latitude": 46.2275033483167
      },
      {
        "Gemeinde": "Comunanza Cadenazzo/Monteceneri",
        "Longitude": 9.05000381241506,
        "Latitude": 46.1443744629768
      },
      {
        "Gemeinde": "Comunanza Capriasca/Lugano",
        "Longitude": 9.02522023590106,
        "Latitude": 46.0934399597416
      },
      {
        "Gemeinde": "Terre di Pedemonte",
        "Longitude": 8.73127645418731,
        "Latitude": 46.1862629535852
      },
      {
        "Gemeinde": "Centovalli",
        "Longitude": 8.69998772657744,
        "Latitude": 46.1776196690689
      },
      {
        "Gemeinde": "Gambarogno",
        "Longitude": 8.85722406504653,
        "Latitude": 46.1478624900541
      },
      {
        "Gemeinde": "Aigle",
        "Longitude": 6.96605428347511,
        "Latitude": 46.3177113922291
      },
      {
        "Gemeinde": "Bex",
        "Longitude": 7.01461763201194,
        "Latitude": 46.2504363947554
      },
      {
        "Gemeinde": "Chessel",
        "Longitude": 6.89432455154542,
        "Latitude": 46.3497740040363
      },
      {
        "Gemeinde": "Corbeyrier",
        "Longitude": 6.96056845230124,
        "Latitude": 46.3509737357473
      },
      {
        "Gemeinde": "Gryon",
        "Longitude": 7.06243441984212,
        "Latitude": 46.2739948005984
      },
      {
        "Gemeinde": "Lavey-Morcles",
        "Longitude": 7.02004724425132,
        "Latitude": 46.2189713971161
      },
      {
        "Gemeinde": "Leysin",
        "Longitude": 7.00999729736186,
        "Latitude": 46.3430759579736
      },
      {
        "Gemeinde": "Noville",
        "Longitude": 6.90049933843208,
        "Latitude": 46.3821892457432
      },
      {
        "Gemeinde": "Ollon",
        "Longitude": 7.0298268914715,
        "Latitude": 46.2972708024841
      },
      {
        "Gemeinde": "Ormont-Dessous",
        "Longitude": 7.05142659093538,
        "Latitude": 46.3621167930953
      },
      {
        "Gemeinde": "Ormont-Dessus",
        "Longitude": 7.15282383940495,
        "Latitude": 46.3534234546399
      },
      {
        "Gemeinde": "Rennaz",
        "Longitude": 6.91875729543129,
        "Latitude": 46.3759772521377
      },
      {
        "Gemeinde": "Roche (VD)",
        "Longitude": 6.93189672552558,
        "Latitude": 46.3607437038596
      },
      {
        "Gemeinde": "Villeneuve (VD)",
        "Longitude": 6.92635161900884,
        "Latitude": 46.3976024201349
      },
      {
        "Gemeinde": "Yvorne",
        "Longitude": 6.96074253683705,
        "Latitude": 46.3311831549755
      },
      {
        "Gemeinde": "Apples",
        "Longitude": 6.42805689434807,
        "Latitude": 46.5525874013063
      },
      {
        "Gemeinde": "Aubonne",
        "Longitude": 6.39136122223584,
        "Latitude": 46.4946778499128
      },
      {
        "Gemeinde": "Ballens",
        "Longitude": 6.37454721351098,
        "Latitude": 46.5547974146941
      },
      {
        "Gemeinde": "Berolle",
        "Longitude": 6.33666180190417,
        "Latitude": 46.558034859325
      },
      {
        "Gemeinde": "Bière",
        "Longitude": 6.33317295681095,
        "Latitude": 46.5373090367697
      },
      {
        "Gemeinde": "Bougy-Villars",
        "Longitude": 6.35519960259068,
        "Latitude": 46.4790442553032
      },
      {
        "Gemeinde": "Féchy",
        "Longitude": 6.37078858875946,
        "Latitude": 46.4809914030712
      },
      {
        "Gemeinde": "Gimel",
        "Longitude": 6.30768760994563,
        "Latitude": 46.5091688697414
      },
      {
        "Gemeinde": "Longirod",
        "Longitude": 6.25849727525652,
        "Latitude": 46.4942734957099
      },
      {
        "Gemeinde": "Marchissy",
        "Longitude": 6.24691420392425,
        "Latitude": 46.4878548370237
      },
      {
        "Gemeinde": "Mollens (VD)",
        "Longitude": 6.35714693121663,
        "Latitude": 46.5771241826048
      },
      {
        "Gemeinde": "Montherod",
        "Longitude": 6.36652637812383,
        "Latitude": 46.4989441234332
      },
      {
        "Gemeinde": "Saint-George",
        "Longitude": 6.26067125047033,
        "Latitude": 46.5140886753701
      },
      {
        "Gemeinde": "Saint-Livres",
        "Longitude": 6.38719212871234,
        "Latitude": 46.5081339614419
      },
      {
        "Gemeinde": "Saint-Oyens",
        "Longitude": 6.30921563340824,
        "Latitude": 46.4983881931926
      },
      {
        "Gemeinde": "Saubraz",
        "Longitude": 6.32972398627198,
        "Latitude": 46.5147841580349
      },
      {
        "Gemeinde": "Avenches",
        "Longitude": 7.039819265119,
        "Latitude": 46.8802231832377
      },
      {
        "Gemeinde": "Cudrefin",
        "Longitude": 7.01955102443753,
        "Latitude": 46.9557115468208
      },
      {
        "Gemeinde": "Faoug",
        "Longitude": 7.0776761321135,
        "Latitude": 46.9082342412355
      },
      {
        "Gemeinde": "Vully-les-Lacs",
        "Longitude": 7.02246548461665,
        "Latitude": 46.9188410125337
      },
      {
        "Gemeinde": "Bettens",
        "Longitude": 6.57682471240713,
        "Latitude": 46.6275822497226
      },
      {
        "Gemeinde": "Bournens",
        "Longitude": 6.56284209289345,
        "Latitude": 46.6040856722729
      },
      {
        "Gemeinde": "Boussens",
        "Longitude": 6.5824328168881,
        "Latitude": 46.6033351978518
      },
      {
        "Gemeinde": "La Chaux (Cossonay)",
        "Longitude": 6.47253395506633,
        "Latitude": 46.6177479348784
      },
      {
        "Gemeinde": "Chavannes-le-Veyron",
        "Longitude": 6.45055576284028,
        "Latitude": 46.6058636715596
      },
      {
        "Gemeinde": "Chevilly",
        "Longitude": 6.47600102932584,
        "Latitude": 46.6429667548891
      },
      {
        "Gemeinde": "Cossonay",
        "Longitude": 6.50785784903938,
        "Latitude": 46.6135445195011
      },
      {
        "Gemeinde": "Cottens (VD)",
        "Longitude": 6.45506110098286,
        "Latitude": 46.5735161286681
      },
      {
        "Gemeinde": "Cuarnens",
        "Longitude": 6.43844360968865,
        "Latitude": 46.625549704079
      },
      {
        "Gemeinde": "Daillens",
        "Longitude": 6.54821895349741,
        "Latitude": 46.6201650979109
      },
      {
        "Gemeinde": "Dizy",
        "Longitude": 6.49573285712538,
        "Latitude": 46.6350355304311
      },
      {
        "Gemeinde": "Eclépens",
        "Longitude": 6.52547817348026,
        "Latitude": 46.6523707213265
      },
      {
        "Gemeinde": "Ferreyres",
        "Longitude": 6.48487288146707,
        "Latitude": 46.6583349321538
      },
      {
        "Gemeinde": "Gollion",
        "Longitude": 6.50833826532359,
        "Latitude": 46.5856600564584
      },
      {
        "Gemeinde": "Grancy",
        "Longitude": 6.46515561499234,
        "Latitude": 46.592495397452
      },
      {
        "Gemeinde": "L'Isle",
        "Longitude": 6.41124815939485,
        "Latitude": 46.6136117872797
      },
      {
        "Gemeinde": "Lussery-Villars",
        "Longitude": 6.52584320848844,
        "Latitude": 46.6307830619219
      },
      {
        "Gemeinde": "Mauraz",
        "Longitude": 6.4244701771379,
        "Latitude": 46.6047341618508
      },
      {
        "Gemeinde": "Mex (VD)",
        "Longitude": 6.55152469123448,
        "Latitude": 46.5779087443132
      },
      {
        "Gemeinde": "Moiry",
        "Longitude": 6.45368385744324,
        "Latitude": 46.6490729931754
      },
      {
        "Gemeinde": "Mont-la-Ville",
        "Longitude": 6.40932600453044,
        "Latitude": 46.6459813018296
      },
      {
        "Gemeinde": "Montricher",
        "Longitude": 6.3775758331081,
        "Latitude": 46.5998078007452
      },
      {
        "Gemeinde": "Orny",
        "Longitude": 6.526525843567,
        "Latitude": 46.6676724901747
      },
      {
        "Gemeinde": "Pampigny",
        "Longitude": 6.42753521260009,
        "Latitude": 46.5804713786788
      },
      {
        "Gemeinde": "Penthalaz",
        "Longitude": 6.5274376305332,
        "Latitude": 46.6137031202598
      },
      {
        "Gemeinde": "Penthaz",
        "Longitude": 6.53810530298244,
        "Latitude": 46.6002938742948
      },
      {
        "Gemeinde": "Pompaples",
        "Longitude": 6.51086171092452,
        "Latitude": 46.6666462536973
      },
      {
        "Gemeinde": "La Sarraz",
        "Longitude": 6.51232291064551,
        "Latitude": 46.6576620491002
      },
      {
        "Gemeinde": "Senarclens",
        "Longitude": 6.48849978367658,
        "Latitude": 46.6007896348835
      },
      {
        "Gemeinde": "Sévery",
        "Longitude": 6.43807128437401,
        "Latitude": 46.5751669211752
      },
      {
        "Gemeinde": "Sullens",
        "Longitude": 6.56562679068614,
        "Latitude": 46.5933115962338
      },
      {
        "Gemeinde": "Vufflens-la-Ville",
        "Longitude": 6.53978450852148,
        "Latitude": 46.5778164890981
      },
      {
        "Gemeinde": "Assens",
        "Longitude": 6.62275457391747,
        "Latitude": 46.6126277816333
      },
      {
        "Gemeinde": "Bercher",
        "Longitude": 6.71046191734689,
        "Latitude": 46.6914876422419
      },
      {
        "Gemeinde": "Bioley-Orjulaz",
        "Longitude": 6.59913307328145,
        "Latitude": 46.6205522011732
      },
      {
        "Gemeinde": "Bottens",
        "Longitude": 6.65922581089955,
        "Latitude": 46.618280788948
      },
      {
        "Gemeinde": "Bretigny-sur-Morrens",
        "Longitude": 6.6412417962109,
        "Latitude": 46.5983650749288
      },
      {
        "Gemeinde": "Cugy (VD)",
        "Longitude": 6.64016282076066,
        "Latitude": 46.5830642476457
      },
      {
        "Gemeinde": "Echallens",
        "Longitude": 6.63408699410524,
        "Latitude": 46.640596004996
      },
      {
        "Gemeinde": "Essertines-sur-Yverdon",
        "Longitude": 6.63821711263509,
        "Latitude": 46.7143920089288
      },
      {
        "Gemeinde": "Etagnières",
        "Longitude": 6.61250485305505,
        "Latitude": 46.5999591515917
      },
      {
        "Gemeinde": "Fey",
        "Longitude": 6.68323689736771,
        "Latitude": 46.6751175664736
      },
      {
        "Gemeinde": "Froideville",
        "Longitude": 6.68297590011026,
        "Latitude": 46.6004488637771
      },
      {
        "Gemeinde": "Morrens (VD)",
        "Longitude": 6.6269951233205,
        "Latitude": 46.591067473283
      },
      {
        "Gemeinde": "Oulens-sous-Echallens",
        "Longitude": 6.57659485778157,
        "Latitude": 46.6419743430777
      },
      {
        "Gemeinde": "Pailly",
        "Longitude": 6.67502660178188,
        "Latitude": 46.7011509420484
      },
      {
        "Gemeinde": "Penthéréaz",
        "Longitude": 6.60340900413674,
        "Latitude": 46.6817568429496
      },
      {
        "Gemeinde": "Poliez-Pittet",
        "Longitude": 6.68129253547865,
        "Latitude": 46.6274258815445
      },
      {
        "Gemeinde": "Rueyres",
        "Longitude": 6.69081605384797,
        "Latitude": 46.6940590850783
      },
      {
        "Gemeinde": "Saint-Barthélemy (VD)",
        "Longitude": 6.60021503139576,
        "Latitude": 46.6349539150492
      },
      {
        "Gemeinde": "Villars-le-Terroir",
        "Longitude": 6.63907123280807,
        "Latitude": 46.6568239768125
      },
      {
        "Gemeinde": "Vuarrens",
        "Longitude": 6.64779413080351,
        "Latitude": 46.6856720854007
      },
      {
        "Gemeinde": "Montilliez",
        "Longitude": 6.66417671937264,
        "Latitude": 46.6372062729304
      },
      {
        "Gemeinde": "Goumoëns",
        "Longitude": 6.60377091512309,
        "Latitude": 46.6583698981239
      },
      {
        "Gemeinde": "Bonvillars",
        "Longitude": 6.6704489872896,
        "Latitude": 46.8387563680486
      },
      {
        "Gemeinde": "Bullet",
        "Longitude": 6.5539081690602,
        "Latitude": 46.8307160209822
      },
      {
        "Gemeinde": "Champagne",
        "Longitude": 6.65875646588957,
        "Latitude": 46.8314804940558
      },
      {
        "Gemeinde": "Concise",
        "Longitude": 6.72006694453962,
        "Latitude": 46.8534723187218
      },
      {
        "Gemeinde": "Corcelles-près-Concise",
        "Longitude": 6.70835228282237,
        "Latitude": 46.8471012164084
      },
      {
        "Gemeinde": "Fiez",
        "Longitude": 6.62473559797172,
        "Latitude": 46.8276452437414
      },
      {
        "Gemeinde": "Fontaines-sur-Grandson",
        "Longitude": 6.61938383596725,
        "Latitude": 46.8348037265628
      },
      {
        "Gemeinde": "Giez",
        "Longitude": 6.61843010448791,
        "Latitude": 46.8114072752169
      },
      {
        "Gemeinde": "Grandevent",
        "Longitude": 6.60622083675462,
        "Latitude": 46.8383064907643
      },
      {
        "Gemeinde": "Grandson",
        "Longitude": 6.6446860034217,
        "Latitude": 46.8079946670081
      },
      {
        "Gemeinde": "Mauborget",
        "Longitude": 6.61644509378969,
        "Latitude": 46.8554718565854
      },
      {
        "Gemeinde": "Mutrux",
        "Longitude": 6.72755224552859,
        "Latitude": 46.8823049894338
      },
      {
        "Gemeinde": "Novalles",
        "Longitude": 6.59588988023465,
        "Latitude": 46.828335647923
      },
      {
        "Gemeinde": "Onnens (VD)",
        "Longitude": 6.68747700652829,
        "Latitude": 46.8397694079824
      },
      {
        "Gemeinde": "Provence",
        "Longitude": 6.72613284194585,
        "Latitude": 46.8903921640249
      },
      {
        "Gemeinde": "Sainte-Croix",
        "Longitude": 6.50162572683476,
        "Latitude": 46.8222023281761
      },
      {
        "Gemeinde": "Tévenon",
        "Longitude": 6.6270706933122,
        "Latitude": 46.8465524665515
      },
      {
        "Gemeinde": "Belmont-sur-Lausanne",
        "Longitude": 6.67888194347,
        "Latitude": 46.5203569209439
      },
      {
        "Gemeinde": "Cheseaux-sur-Lausanne",
        "Longitude": 6.60491097048764,
        "Latitude": 46.5846101284729
      },
      {
        "Gemeinde": "Crissier",
        "Longitude": 6.57798673002645,
        "Latitude": 46.5547219868229
      },
      {
        "Gemeinde": "Epalinges",
        "Longitude": 6.67455322645487,
        "Latitude": 46.5500149198522
      },
      {
        "Gemeinde": "Jouxtens-Mézery",
        "Longitude": 6.5988910582991,
        "Latitude": 46.5521795642873
      },
      {
        "Gemeinde": "Lausanne",
        "Longitude": 6.63327389248852,
        "Latitude": 46.5200422704728
      },
      {
        "Gemeinde": "Le Mont-sur-Lausanne",
        "Longitude": 6.63529204015515,
        "Latitude": 46.5596399825199
      },
      {
        "Gemeinde": "Paudex",
        "Longitude": 6.66996513042325,
        "Latitude": 46.5059031986486
      },
      {
        "Gemeinde": "Prilly",
        "Longitude": 6.60567349557565,
        "Latitude": 46.5351367414416
      },
      {
        "Gemeinde": "Pully",
        "Longitude": 6.65947826496347,
        "Latitude": 46.5103296464155
      },
      {
        "Gemeinde": "Renens (VD)",
        "Longitude": 6.57956206226142,
        "Latitude": 46.5376412704921
      },
      {
        "Gemeinde": "Romanel-sur-Lausanne",
        "Longitude": 6.60392572628172,
        "Latitude": 46.5639118250077
      },
      {
        "Gemeinde": "Chexbres",
        "Longitude": 6.77708943279985,
        "Latitude": 46.4822894936135
      },
      {
        "Gemeinde": "Forel (Lavaux)",
        "Longitude": 6.76985560800086,
        "Latitude": 46.5407208305532
      },
      {
        "Gemeinde": "Lutry",
        "Longitude": 6.68693848618509,
        "Latitude": 46.5033181950987
      },
      {
        "Gemeinde": "Puidoux",
        "Longitude": 6.78337173926225,
        "Latitude": 46.5012174820779
      },
      {
        "Gemeinde": "Rivaz",
        "Longitude": 6.77846858853863,
        "Latitude": 46.4760003853795
      },
      {
        "Gemeinde": "Saint-Saphorin (Lavaux)",
        "Longitude": 6.79542741281379,
        "Latitude": 46.4733991881387
      },
      {
        "Gemeinde": "Savigny",
        "Longitude": 6.7320748076132,
        "Latitude": 46.5386928401012
      },
      {
        "Gemeinde": "Bourg-en-Lavaux",
        "Longitude": 6.71571828575987,
        "Latitude": 46.4945091620804
      },
      {
        "Gemeinde": "Aclens",
        "Longitude": 6.50995206194925,
        "Latitude": 46.567680693035
      },
      {
        "Gemeinde": "Bremblens",
        "Longitude": 6.51814484548784,
        "Latitude": 46.5461563522901
      },
      {
        "Gemeinde": "Buchillon",
        "Longitude": 6.42048870616719,
        "Latitude": 46.4697527809228
      },
      {
        "Gemeinde": "Bussigny",
        "Longitude": 6.55198214188619,
        "Latitude": 46.5500238674336
      },
      {
        "Gemeinde": "Bussy-Chardonney",
        "Longitude": 6.44152660255689,
        "Latitude": 46.529315975934
      },
      {
        "Gemeinde": "Chavannes-près-Renens",
        "Longitude": 6.57189949883045,
        "Latitude": 46.5276871909863
      },
      {
        "Gemeinde": "Chigny",
        "Longitude": 6.47689102136464,
        "Latitude": 46.5197252609572
      },
      {
        "Gemeinde": "Clarmont",
        "Longitude": 6.45032077402842,
        "Latitude": 46.5473855832324
      },
      {
        "Gemeinde": "Denens",
        "Longitude": 6.4573617500188,
        "Latitude": 46.5186584221152
      },
      {
        "Gemeinde": "Denges",
        "Longitude": 6.54066617954012,
        "Latitude": 46.5247457159793
      },
      {
        "Gemeinde": "Echandens",
        "Longitude": 6.54051703676672,
        "Latitude": 46.5337408876732
      },
      {
        "Gemeinde": "Echichens",
        "Longitude": 6.49893346887324,
        "Latitude": 46.526207330382
      },
      {
        "Gemeinde": "Ecublens (VD)",
        "Longitude": 6.56535418695896,
        "Latitude": 46.5294363458346
      },
      {
        "Gemeinde": "Etoy",
        "Longitude": 6.42018415738062,
        "Latitude": 46.4859437863845
      },
      {
        "Gemeinde": "Lavigny",
        "Longitude": 6.40695607083219,
        "Latitude": 46.4966199600391
      },
      {
        "Gemeinde": "Lonay",
        "Longitude": 6.52107281580381,
        "Latitude": 46.5272878802165
      },
      {
        "Gemeinde": "Lully (VD)",
        "Longitude": 6.46542257457806,
        "Latitude": 46.5052333806116
      },
      {
        "Gemeinde": "Lussy-sur-Morges",
        "Longitude": 6.4498067270837,
        "Latitude": 46.5041986951553
      },
      {
        "Gemeinde": "Morges",
        "Longitude": 6.50172664702057,
        "Latitude": 46.5154352502469
      },
      {
        "Gemeinde": "Préverenges",
        "Longitude": 6.52775556718284,
        "Latitude": 46.51744598326
      },
      {
        "Gemeinde": "Reverolle",
        "Longitude": 6.4386872024871,
        "Latitude": 46.5418859064513
      },
      {
        "Gemeinde": "Romanel-sur-Morges",
        "Longitude": 6.51015287497382,
        "Latitude": 46.5559871918924
      },
      {
        "Gemeinde": "Saint-Prex",
        "Longitude": 6.45672841354708,
        "Latitude": 46.4817679045088
      },
      {
        "Gemeinde": "Saint-Sulpice (VD)",
        "Longitude": 6.55784193380283,
        "Latitude": 46.5104860146549
      },
      {
        "Gemeinde": "Tolochenaz",
        "Longitude": 6.4745415536931,
        "Latitude": 46.505311165518
      },
      {
        "Gemeinde": "Vaux-sur-Morges",
        "Longitude": 6.46356881618815,
        "Latitude": 46.5358048996514
      },
      {
        "Gemeinde": "Villars-Sainte-Croix",
        "Longitude": 6.56212094688923,
        "Latitude": 46.5680951325326
      },
      {
        "Gemeinde": "Villars-sous-Yens",
        "Longitude": 6.43014946689475,
        "Latitude": 46.510323094979
      },
      {
        "Gemeinde": "Vufflens-le-Château",
        "Longitude": 6.47024702180979,
        "Latitude": 46.5268657604316
      },
      {
        "Gemeinde": "Vullierens",
        "Longitude": 6.48246829922634,
        "Latitude": 46.5728504678651
      },
      {
        "Gemeinde": "Yens",
        "Longitude": 6.41827151883583,
        "Latitude": 46.5183136490797
      },
      {
        "Gemeinde": "Boulens",
        "Longitude": 6.71974443740421,
        "Latitude": 46.681651079454
      },
      {
        "Gemeinde": "Bussy-sur-Moudon",
        "Longitude": 6.811193697681,
        "Latitude": 46.6857897708095
      },
      {
        "Gemeinde": "Chavannes-sur-Moudon",
        "Longitude": 6.80890506461138,
        "Latitude": 46.6578900048527
      },
      {
        "Gemeinde": "Curtilles",
        "Longitude": 6.84896172827059,
        "Latitude": 46.6985845670777
      },
      {
        "Gemeinde": "Dompierre (VD)",
        "Longitude": 6.88286228520615,
        "Latitude": 46.7077505952643
      },
      {
        "Gemeinde": "Hermenches",
        "Longitude": 6.75946464315376,
        "Latitude": 46.6414135097564
      },
      {
        "Gemeinde": "Lovatens",
        "Longitude": 6.86472744932245,
        "Latitude": 46.6914684737246
      },
      {
        "Gemeinde": "Lucens",
        "Longitude": 6.8383921870485,
        "Latitude": 46.7084251502377
      },
      {
        "Gemeinde": "Moudon",
        "Longitude": 6.7983254027528,
        "Latitude": 46.6686262762759
      },
      {
        "Gemeinde": "Ogens",
        "Longitude": 6.72327162568831,
        "Latitude": 46.7113598690484
      },
      {
        "Gemeinde": "Prévonloup",
        "Longitude": 6.88033073199547,
        "Latitude": 46.6996421985864
      },
      {
        "Gemeinde": "Rossenges",
        "Longitude": 6.7736646036924,
        "Latitude": 46.6549911009355
      },
      {
        "Gemeinde": "Syens",
        "Longitude": 6.77899977761768,
        "Latitude": 46.6460262906778
      },
      {
        "Gemeinde": "Villars-le-Comte",
        "Longitude": 6.79913058678811,
        "Latitude": 46.7109109832898
      },
      {
        "Gemeinde": "Vucherens",
        "Longitude": 6.7740636958744,
        "Latitude": 46.6226082814543
      },
      {
        "Gemeinde": "Montanaire",
        "Longitude": 6.75606714883185,
        "Latitude": 46.7034648757184
      },
      {
        "Gemeinde": "Arnex-sur-Nyon",
        "Longitude": 6.19090595346798,
        "Latitude": 46.3747930661237
      },
      {
        "Gemeinde": "Arzier-Le Muids",
        "Longitude": 6.20848141024212,
        "Latitude": 46.4595547859961
      },
      {
        "Gemeinde": "Bassins",
        "Longitude": 6.23311070321354,
        "Latitude": 46.4643176113468
      },
      {
        "Gemeinde": "Begnins",
        "Longitude": 6.25054536049223,
        "Latitude": 46.4411101863039
      },
      {
        "Gemeinde": "Bogis-Bossey",
        "Longitude": 6.16670063591402,
        "Latitude": 46.3538305603432
      },
      {
        "Gemeinde": "Borex",
        "Longitude": 6.17650678504275,
        "Latitude": 46.3791316652763
      },
      {
        "Gemeinde": "Chavannes-de-Bogis",
        "Longitude": 6.16173718878332,
        "Latitude": 46.3438782777752
      },
      {
        "Gemeinde": "Chavannes-des-Bois",
        "Longitude": 6.1325376779299,
        "Latitude": 46.3156544780915
      },
      {
        "Gemeinde": "Chéserex",
        "Longitude": 6.17470411121762,
        "Latitude": 46.4007040665753
      },
      {
        "Gemeinde": "Coinsins",
        "Longitude": 6.23791298930085,
        "Latitude": 46.4238835556037
      },
      {
        "Gemeinde": "Commugny",
        "Longitude": 6.17401333892881,
        "Latitude": 46.3188249054839
      },
      {
        "Gemeinde": "Coppet",
        "Longitude": 6.19222858313933,
        "Latitude": 46.3172275374013
      },
      {
        "Gemeinde": "Crans-près-Céligny",
        "Longitude": 6.2042902595399,
        "Latitude": 46.3578456550707
      },
      {
        "Gemeinde": "Crassier",
        "Longitude": 6.16361646311812,
        "Latitude": 46.3744886955005
      },
      {
        "Gemeinde": "Duillier",
        "Longitude": 6.23303030589799,
        "Latitude": 46.4094367781767
      },
      {
        "Gemeinde": "Eysins",
        "Longitude": 6.20635702555839,
        "Latitude": 46.3812598255278
      },
      {
        "Gemeinde": "Founex",
        "Longitude": 6.19315561880561,
        "Latitude": 46.3334322042376
      },
      {
        "Gemeinde": "Genolier",
        "Longitude": 6.21685860640251,
        "Latitude": 46.4344545652579
      },
      {
        "Gemeinde": "Gingins",
        "Longitude": 6.17841630371716,
        "Latitude": 46.4088425640982
      },
      {
        "Gemeinde": "Givrins",
        "Longitude": 6.20137060631417,
        "Latitude": 46.4288884929066
      },
      {
        "Gemeinde": "Gland",
        "Longitude": 6.26400492993748,
        "Latitude": 46.4205580116919
      },
      {
        "Gemeinde": "Grens",
        "Longitude": 6.19047114081071,
        "Latitude": 46.3936814437097
      },
      {
        "Gemeinde": "Mies",
        "Longitude": 6.16917821723789,
        "Latitude": 46.3034763541648
      },
      {
        "Gemeinde": "Nyon",
        "Longitude": 6.23882872610924,
        "Latitude": 46.3825081432806
      },
      {
        "Gemeinde": "Prangins",
        "Longitude": 6.24897005899131,
        "Latitude": 46.3943108079771
      },
      {
        "Gemeinde": "La Rippe",
        "Longitude": 6.15045087780052,
        "Latitude": 46.3815371646126
      },
      {
        "Gemeinde": "Saint-Cergue",
        "Longitude": 6.15801992956082,
        "Latitude": 46.446400317323
      },
      {
        "Gemeinde": "Signy-Avenex",
        "Longitude": 6.20225292104748,
        "Latitude": 46.3902117865984
      },
      {
        "Gemeinde": "Tannay",
        "Longitude": 6.17683945898076,
        "Latitude": 46.3089598819627
      },
      {
        "Gemeinde": "Trélex",
        "Longitude": 6.20427945651277,
        "Latitude": 46.4154250366276
      },
      {
        "Gemeinde": "Le Vaud",
        "Longitude": 6.23411212518974,
        "Latitude": 46.4778233198437
      },
      {
        "Gemeinde": "Vich",
        "Longitude": 6.25080162492488,
        "Latitude": 46.4294171470594
      },
      {
        "Gemeinde": "L'Abergement",
        "Longitude": 6.48971194628597,
        "Latitude": 46.7546346404986
      },
      {
        "Gemeinde": "Agiez",
        "Longitude": 6.50736314778155,
        "Latitude": 46.7178959043962
      },
      {
        "Gemeinde": "Arnex-sur-Orbe",
        "Longitude": 6.51956327154987,
        "Latitude": 46.692805700437
      },
      {
        "Gemeinde": "Ballaigues",
        "Longitude": 6.41426826003519,
        "Latitude": 46.7296918919608
      },
      {
        "Gemeinde": "Baulmes",
        "Longitude": 6.52314304131222,
        "Latitude": 46.7899923875539
      },
      {
        "Gemeinde": "Bavois",
        "Longitude": 6.56676991302433,
        "Latitude": 46.6841809194345
      },
      {
        "Gemeinde": "Bofflens",
        "Longitude": 6.49845930432587,
        "Latitude": 46.7034288303329
      },
      {
        "Gemeinde": "Bretonnières",
        "Longitude": 6.47213211133121,
        "Latitude": 46.7131042686489
      },
      {
        "Gemeinde": "Chavornay",
        "Longitude": 6.57034327132512,
        "Latitude": 46.7057987921936
      },
      {
        "Gemeinde": "Les Clées",
        "Longitude": 6.4626360669028,
        "Latitude": 46.7319155759063
      },
      {
        "Gemeinde": "Croy",
        "Longitude": 6.47639265956993,
        "Latitude": 46.6942482829734
      },
      {
        "Gemeinde": "Juriens",
        "Longitude": 6.4489897574175,
        "Latitude": 46.6913145739609
      },
      {
        "Gemeinde": "Lignerolle",
        "Longitude": 6.45593119530256,
        "Latitude": 46.7408540990799
      },
      {
        "Gemeinde": "Montcherand",
        "Longitude": 6.5110235265729,
        "Latitude": 46.7332192856772
      },
      {
        "Gemeinde": "Orbe",
        "Longitude": 6.53341434096257,
        "Latitude": 46.7244031472765
      },
      {
        "Gemeinde": "La Praz",
        "Longitude": 6.42720650450247,
        "Latitude": 46.6677328423261
      },
      {
        "Gemeinde": "Premier",
        "Longitude": 6.44481932129008,
        "Latitude": 46.7047726161146
      },
      {
        "Gemeinde": "Rances",
        "Longitude": 6.53019196594193,
        "Latitude": 46.7603619713994
      },
      {
        "Gemeinde": "Romainmôtier-Envy",
        "Longitude": 6.46072185871984,
        "Latitude": 46.6932151659335
      },
      {
        "Gemeinde": "Sergey",
        "Longitude": 6.50024449873418,
        "Latitude": 46.7511234079586
      },
      {
        "Gemeinde": "Valeyres-sous-Rances",
        "Longitude": 6.52507848581738,
        "Latitude": 46.753124264437
      },
      {
        "Gemeinde": "Vallorbe",
        "Longitude": 6.37930276150267,
        "Latitude": 46.7113795656429
      },
      {
        "Gemeinde": "Vaulion",
        "Longitude": 6.39020190001235,
        "Latitude": 46.6889894223866
      },
      {
        "Gemeinde": "Vuiteboeuf",
        "Longitude": 6.54905266948458,
        "Latitude": 46.8072895675559
      },
      {
        "Gemeinde": "Corcelles-le-Jorat",
        "Longitude": 6.7416218194891,
        "Latitude": 46.6071210643041
      },
      {
        "Gemeinde": "Essertes",
        "Longitude": 6.78915046613115,
        "Latitude": 46.5624230127887
      },
      {
        "Gemeinde": "Maracon",
        "Longitude": 6.8714428339004,
        "Latitude": 46.5502691547598
      },
      {
        "Gemeinde": "Montpreveyres",
        "Longitude": 6.74064233608061,
        "Latitude": 46.5819264134423
      },
      {
        "Gemeinde": "Ropraz",
        "Longitude": 6.75197191989819,
        "Latitude": 46.6143808075519
      },
      {
        "Gemeinde": "Servion",
        "Longitude": 6.78377044176676,
        "Latitude": 46.575885990042
      },
      {
        "Gemeinde": "Vulliens",
        "Longitude": 6.79236325888626,
        "Latitude": 46.6209145345148
      },
      {
        "Gemeinde": "Jorat-Menthue",
        "Longitude": 6.70351368941258,
        "Latitude": 46.6257724338448
      },
      {
        "Gemeinde": "Oron",
        "Longitude": 6.82686797737906,
        "Latitude": 46.5716281517967
      },
      {
        "Gemeinde": "Jorat-Mézières",
        "Longitude": 6.77557941163923,
        "Latitude": 46.6055248398232
      },
      {
        "Gemeinde": "Champtauroz",
        "Longitude": 6.78937977133805,
        "Latitude": 46.760331820901
      },
      {
        "Gemeinde": "Chevroux",
        "Longitude": 6.90854519828346,
        "Latitude": 46.888684805802
      },
      {
        "Gemeinde": "Corcelles-près-Payerne",
        "Longitude": 6.9615389472755,
        "Latitude": 46.8313471430834
      },
      {
        "Gemeinde": "Grandcour",
        "Longitude": 6.92970004849066,
        "Latitude": 46.8716896356975
      },
      {
        "Gemeinde": "Henniez",
        "Longitude": 6.88381765586372,
        "Latitude": 46.7419391309673
      },
      {
        "Gemeinde": "Missy",
        "Longitude": 6.97030672658337,
        "Latitude": 46.8781602336288
      },
      {
        "Gemeinde": "Payerne",
        "Longitude": 6.93672843271617,
        "Latitude": 46.8213452899413
      },
      {
        "Gemeinde": "Trey",
        "Longitude": 6.92543216380798,
        "Latitude": 46.7691207699849
      },
      {
        "Gemeinde": "Treytorrens (Payerne)",
        "Longitude": 6.801032043675,
        "Latitude": 46.7711919848272
      },
      {
        "Gemeinde": "Villarzel",
        "Longitude": 6.91384237203121,
        "Latitude": 46.7492776040056
      },
      {
        "Gemeinde": "Valbroye",
        "Longitude": 6.88753161768551,
        "Latitude": 46.7626469165872
      },
      {
        "Gemeinde": "Château-d'Oex",
        "Longitude": 7.13265547534996,
        "Latitude": 46.4739111468312
      },
      {
        "Gemeinde": "Rossinière",
        "Longitude": 7.08191811685227,
        "Latitude": 46.4674655908158
      },
      {
        "Gemeinde": "Rougemont",
        "Longitude": 7.20941130868275,
        "Latitude": 46.4893847963578
      },
      {
        "Gemeinde": "Allaman",
        "Longitude": 6.39573645024212,
        "Latitude": 46.4704276312522
      },
      {
        "Gemeinde": "Bursinel",
        "Longitude": 6.30394773136296,
        "Latitude": 46.4389582931782
      },
      {
        "Gemeinde": "Bursins",
        "Longitude": 6.29067059790646,
        "Latitude": 46.4514200423988
      },
      {
        "Gemeinde": "Burtigny",
        "Longitude": 6.25780320493348,
        "Latitude": 46.4663766842484
      },
      {
        "Gemeinde": "Dully",
        "Longitude": 6.29757500115341,
        "Latitude": 46.4325967287974
      },
      {
        "Gemeinde": "Essertines-sur-Rolle",
        "Longitude": 6.31716107305143,
        "Latitude": 46.4921693728759
      },
      {
        "Gemeinde": "Gilly",
        "Longitude": 6.29704466485395,
        "Latitude": 46.4577819106315
      },
      {
        "Gemeinde": "Luins",
        "Longitude": 6.27136331221714,
        "Latitude": 46.4413264117401
      },
      {
        "Gemeinde": "Mont-sur-Rolle",
        "Longitude": 6.33713560599931,
        "Latitude": 46.4707732694359
      },
      {
        "Gemeinde": "Perroy",
        "Longitude": 6.36584742929059,
        "Latitude": 46.4674500401315
      },
      {
        "Gemeinde": "Rolle",
        "Longitude": 6.33609022157209,
        "Latitude": 46.4581681858625
      },
      {
        "Gemeinde": "Tartegnin",
        "Longitude": 6.31639957551879,
        "Latitude": 46.4660718628591
      },
      {
        "Gemeinde": "Vinzel",
        "Longitude": 6.27905458368972,
        "Latitude": 46.4468034269653
      },
      {
        "Gemeinde": "L'Abbaye",
        "Longitude": 6.2726572130432,
        "Latitude": 46.6230711986159
      },
      {
        "Gemeinde": "Le Chenit",
        "Longitude": 6.22347383330553,
        "Latitude": 46.6036636116236
      },
      {
        "Gemeinde": "Le Lieu",
        "Longitude": 6.29931352603193,
        "Latitude": 46.6593276908408
      },
      {
        "Gemeinde": "Blonay",
        "Longitude": 6.89447924311691,
        "Latitude": 46.4640224034908
      },
      {
        "Gemeinde": "Chardonne",
        "Longitude": 6.82663474009557,
        "Latitude": 46.4771702432823
      },
      {
        "Gemeinde": "Corseaux",
        "Longitude": 6.82538376915864,
        "Latitude": 46.4726654969506
      },
      {
        "Gemeinde": "Corsier-sur-Vevey",
        "Longitude": 6.84233930680813,
        "Latitude": 46.4700571832225
      },
      {
        "Gemeinde": "Jongny",
        "Longitude": 6.84353231972475,
        "Latitude": 46.4799589543937
      },
      {
        "Gemeinde": "Montreux",
        "Longitude": 6.91168329308358,
        "Latitude": 46.4353170042826
      },
      {
        "Gemeinde": "Saint-Légier-La Chiésaz",
        "Longitude": 6.88008557360462,
        "Latitude": 46.471149111153
      },
      {
        "Gemeinde": "La Tour-de-Peilz",
        "Longitude": 6.86074871478725,
        "Latitude": 46.4530602620278
      },
      {
        "Gemeinde": "Vevey",
        "Longitude": 6.84504171712805,
        "Latitude": 46.4610754496118
      },
      {
        "Gemeinde": "Veytaux",
        "Longitude": 6.92744012594665,
        "Latitude": 46.42009657207
      },
      {
        "Gemeinde": "Belmont-sur-Yverdon",
        "Longitude": 6.62466360063999,
        "Latitude": 46.7457821178797
      },
      {
        "Gemeinde": "Bioley-Magnoux",
        "Longitude": 6.71129560094461,
        "Latitude": 46.7265768638865
      },
      {
        "Gemeinde": "Chamblon",
        "Longitude": 6.60582958424489,
        "Latitude": 46.7789312215537
      },
      {
        "Gemeinde": "Champvent",
        "Longitude": 6.57171452369622,
        "Latitude": 46.7831751294058
      },
      {
        "Gemeinde": "Chavannes-le-Chêne",
        "Longitude": 6.77869849868438,
        "Latitude": 46.7773620885915
      },
      {
        "Gemeinde": "Chêne-Pâquier",
        "Longitude": 6.7682912055021,
        "Latitude": 46.771904218931
      },
      {
        "Gemeinde": "Cheseaux-Noréaz",
        "Longitude": 6.67131008421406,
        "Latitude": 46.7784908121905
      },
      {
        "Gemeinde": "Cronay",
        "Longitude": 6.69649789727611,
        "Latitude": 46.7561675720476
      },
      {
        "Gemeinde": "Cuarny",
        "Longitude": 6.68320786261254,
        "Latitude": 46.7704737232042
      },
      {
        "Gemeinde": "Démoret",
        "Longitude": 6.75681671868558,
        "Latitude": 46.7475482010248
      },
      {
        "Gemeinde": "Donneloye",
        "Longitude": 6.71497825678574,
        "Latitude": 46.7445918399177
      },
      {
        "Gemeinde": "Ependes (VD)",
        "Longitude": 6.60898888409089,
        "Latitude": 46.7438699918049
      },
      {
        "Gemeinde": "Mathod",
        "Longitude": 6.56542988701879,
        "Latitude": 46.7669344616619
      },
      {
        "Gemeinde": "Molondin",
        "Longitude": 6.7488037077455,
        "Latitude": 46.7600939357069
      },
      {
        "Gemeinde": "Montagny-près-Yverdon",
        "Longitude": 6.61218309801251,
        "Latitude": 46.7915716846646
      },
      {
        "Gemeinde": "Oppens",
        "Longitude": 6.69184912617055,
        "Latitude": 46.7138567619376
      },
      {
        "Gemeinde": "Orges",
        "Longitude": 6.58835357666041,
        "Latitude": 46.8075894177428
      },
      {
        "Gemeinde": "Orzens",
        "Longitude": 6.68254315224885,
        "Latitude": 46.7245903619928
      },
      {
        "Gemeinde": "Pomy",
        "Longitude": 6.66896179098955,
        "Latitude": 46.7595836856636
      },
      {
        "Gemeinde": "Rovray",
        "Longitude": 6.76550424196379,
        "Latitude": 46.7853811245005
      },
      {
        "Gemeinde": "Suchy",
        "Longitude": 6.59884355433069,
        "Latitude": 46.7231048473797
      },
      {
        "Gemeinde": "Suscévaz",
        "Longitude": 6.57856352722465,
        "Latitude": 46.7643354819544
      },
      {
        "Gemeinde": "Treycovagnes",
        "Longitude": 6.60853147008311,
        "Latitude": 46.7735533629621
      },
      {
        "Gemeinde": "Ursins",
        "Longitude": 6.66800045266671,
        "Latitude": 46.7352879841899
      },
      {
        "Gemeinde": "Valeyres-sous-Montagny",
        "Longitude": 6.60945288770355,
        "Latitude": 46.7987486425134
      },
      {
        "Gemeinde": "Valeyres-sous-Ursins",
        "Longitude": 6.65476030271179,
        "Latitude": 46.74599300043
      },
      {
        "Gemeinde": "Villars-Epeney",
        "Longitude": 6.6961505056549,
        "Latitude": 46.7813534871225
      },
      {
        "Gemeinde": "Vugelles-La Mothe",
        "Longitude": 6.5776142584597,
        "Latitude": 46.8237013115717
      },
      {
        "Gemeinde": "Yverdon-les-Bains",
        "Longitude": 6.63987282613938,
        "Latitude": 46.7791745982324
      },
      {
        "Gemeinde": "Yvonand",
        "Longitude": 6.74304518782253,
        "Latitude": 46.8005394581841
      },
      {
        "Gemeinde": "Brig-Glis",
        "Longitude": 7.98911028594726,
        "Latitude": 46.3164634980014
      },
      {
        "Gemeinde": "Eggerberg",
        "Longitude": 7.8800060600175,
        "Latitude": 46.3106441116837
      },
      {
        "Gemeinde": "Naters",
        "Longitude": 7.98791227248945,
        "Latitude": 46.3263648948121
      },
      {
        "Gemeinde": "Ried-Brig",
        "Longitude": 8.01636430782824,
        "Latitude": 46.315428498727
      },
      {
        "Gemeinde": "Simplon",
        "Longitude": 8.05654421470571,
        "Latitude": 46.1955698725172
      },
      {
        "Gemeinde": "Termen",
        "Longitude": 8.02299992407796,
        "Latitude": 46.3288885365465
      },
      {
        "Gemeinde": "Zwischbergen",
        "Longitude": 8.14074087838472,
        "Latitude": 46.1950783841738
      },
      {
        "Gemeinde": "Ardon",
        "Longitude": 7.25723061486746,
        "Latitude": 46.2115063177975
      },
      {
        "Gemeinde": "Chamoson",
        "Longitude": 7.22487915536821,
        "Latitude": 46.2006551058443
      },
      {
        "Gemeinde": "Conthey",
        "Longitude": 7.30512750810535,
        "Latitude": 46.2304640749577
      },
      {
        "Gemeinde": "Nendaz",
        "Longitude": 7.30523291860938,
        "Latitude": 46.1881843282135
      },
      {
        "Gemeinde": "Vétroz",
        "Longitude": 7.28180865489255,
        "Latitude": 46.2259362715589
      },
      {
        "Gemeinde": "Bagnes",
        "Longitude": 7.2512682035432,
        "Latitude": 46.0621690945964
      },
      {
        "Gemeinde": "Bourg-Saint-Pierre",
        "Longitude": 7.20780760142682,
        "Latitude": 45.9496452760744
      },
      {
        "Gemeinde": "Liddes",
        "Longitude": 7.18568909768776,
        "Latitude": 45.9918755517962
      },
      {
        "Gemeinde": "Orsières",
        "Longitude": 7.14676655694668,
        "Latitude": 46.0304622144272
      },
      {
        "Gemeinde": "Sembrancher",
        "Longitude": 7.15168214554462,
        "Latitude": 46.0781512584329
      },
      {
        "Gemeinde": "Vollèges",
        "Longitude": 7.16844174062999,
        "Latitude": 46.0871878334417
      },
      {
        "Gemeinde": "Bellwald",
        "Longitude": 8.1606094201036,
        "Latitude": 46.4234519883676
      },
      {
        "Gemeinde": "Binn",
        "Longitude": 8.18320801470048,
        "Latitude": 46.3639317582831
      },
      {
        "Gemeinde": "Ernen",
        "Longitude": 8.14467334205479,
        "Latitude": 46.3983630448158
      },
      {
        "Gemeinde": "Fiesch",
        "Longitude": 8.13302877762699,
        "Latitude": 46.4029331775046
      },
      {
        "Gemeinde": "Fieschertal",
        "Longitude": 8.14372291854087,
        "Latitude": 46.4253577720688
      },
      {
        "Gemeinde": "Lax",
        "Longitude": 8.11984521040987,
        "Latitude": 46.388619012529
      },
      {
        "Gemeinde": "Obergoms",
        "Longitude": 8.35112735694952,
        "Latitude": 46.5354333169686
      },
      {
        "Gemeinde": "Goms",
        "Longitude": 8.26434326216654,
        "Latitude": 46.486617550041
      },
      {
        "Gemeinde": "Ayent",
        "Longitude": 7.40750263044417,
        "Latitude": 46.2764163924447
      },
      {
        "Gemeinde": "Evolène",
        "Longitude": 7.49555069410545,
        "Latitude": 46.1135840765916
      },
      {
        "Gemeinde": "Hérémence",
        "Longitude": 7.40496720577533,
        "Latitude": 46.1801610889455
      },
      {
        "Gemeinde": "Saint-Martin (VS)",
        "Longitude": 7.44381742162937,
        "Latitude": 46.1729694476235
      },
      {
        "Gemeinde": "Vex",
        "Longitude": 7.39717303065139,
        "Latitude": 46.2116441352381
      },
      {
        "Gemeinde": "Mont-Noble",
        "Longitude": 7.4282674599226,
        "Latitude": 46.2287436535036
      },
      {
        "Gemeinde": "Agarn",
        "Longitude": 7.66445331523227,
        "Latitude": 46.2959872898835
      },
      {
        "Gemeinde": "Albinen",
        "Longitude": 7.63346305226957,
        "Latitude": 46.3401244898289
      },
      {
        "Gemeinde": "Ergisch",
        "Longitude": 7.71375392274976,
        "Latitude": 46.2931800860359
      },
      {
        "Gemeinde": "Inden",
        "Longitude": 7.61789211813045,
        "Latitude": 46.344647973805
      },
      {
        "Gemeinde": "Leuk",
        "Longitude": 7.63468191248413,
        "Latitude": 46.3176327538046
      },
      {
        "Gemeinde": "Leukerbad",
        "Longitude": 7.62970532262896,
        "Latitude": 46.3797108474655
      },
      {
        "Gemeinde": "Oberems",
        "Longitude": 7.69553108483806,
        "Latitude": 46.2815278806767
      },
      {
        "Gemeinde": "Salgesch",
        "Longitude": 7.56975109586822,
        "Latitude": 46.3114296340896
      },
      {
        "Gemeinde": "Varen",
        "Longitude": 7.60742023558295,
        "Latitude": 46.3185763691678
      },
      {
        "Gemeinde": "Guttet-Feschel",
        "Longitude": 7.66587072575986,
        "Latitude": 46.3247708668582
      },
      {
        "Gemeinde": "Gampel-Bratsch",
        "Longitude": 7.74242854767563,
        "Latitude": 46.3155955680604
      },
      {
        "Gemeinde": "Turtmann-Unterems",
        "Longitude": 7.7034072281096,
        "Latitude": 46.300401205078
      },
      {
        "Gemeinde": "Bovernier",
        "Longitude": 7.08703981606462,
        "Latitude": 46.0797664344483
      },
      {
        "Gemeinde": "Charrat",
        "Longitude": 7.1359295419517,
        "Latitude": 46.1212898608348
      },
      {
        "Gemeinde": "Fully",
        "Longitude": 7.11383719344574,
        "Latitude": 46.1383210660417
      },
      {
        "Gemeinde": "Isérables",
        "Longitude": 7.24445072441566,
        "Latitude": 46.1620080125269
      },
      {
        "Gemeinde": "Leytron",
        "Longitude": 7.20809489046403,
        "Latitude": 46.18712834852
      },
      {
        "Gemeinde": "Martigny",
        "Longitude": 7.07010780349368,
        "Latitude": 46.0986039154709
      },
      {
        "Gemeinde": "Martigny-Combe",
        "Longitude": 7.03780223163932,
        "Latitude": 46.0957947504921
      },
      {
        "Gemeinde": "Riddes",
        "Longitude": 7.2224032679199,
        "Latitude": 46.171863470964
      },
      {
        "Gemeinde": "Saillon",
        "Longitude": 7.18485307336243,
        "Latitude": 46.1717850887844
      },
      {
        "Gemeinde": "Saxon",
        "Longitude": 7.17978497304279,
        "Latitude": 46.1483850212374
      },
      {
        "Gemeinde": "Trient",
        "Longitude": 6.9954545307577,
        "Latitude": 46.0560561225159
      },
      {
        "Gemeinde": "Champéry",
        "Longitude": 6.87014759750927,
        "Latitude": 46.1778347660027
      },
      {
        "Gemeinde": "Collombey-Muraz",
        "Longitude": 6.92747793499959,
        "Latitude": 46.2779619132896
      },
      {
        "Gemeinde": "Monthey",
        "Longitude": 6.94975946202156,
        "Latitude": 46.2528725594944
      },
      {
        "Gemeinde": "Port-Valais",
        "Longitude": 6.85239536252618,
        "Latitude": 46.3828499043573
      },
      {
        "Gemeinde": "Saint-Gingolph",
        "Longitude": 6.80549512494,
        "Latitude": 46.3915922834057
      },
      {
        "Gemeinde": "Troistorrents",
        "Longitude": 6.91757545734892,
        "Latitude": 46.2284404829596
      },
      {
        "Gemeinde": "Val-d'Illiez",
        "Longitude": 6.89318424693032,
        "Latitude": 46.2049358184432
      },
      {
        "Gemeinde": "Vionnaz",
        "Longitude": 6.90121222047385,
        "Latitude": 46.310224847826
      },
      {
        "Gemeinde": "Vouvry",
        "Longitude": 6.88796612658232,
        "Latitude": 46.3362494162763
      },
      {
        "Gemeinde": "Bister",
        "Longitude": 8.06491404836721,
        "Latitude": 46.3601495756387
      },
      {
        "Gemeinde": "Bitsch",
        "Longitude": 8.00881999813631,
        "Latitude": 46.3388559024098
      },
      {
        "Gemeinde": "Grengiols",
        "Longitude": 8.09365053939734,
        "Latitude": 46.372581525551
      },
      {
        "Gemeinde": "Riederalp",
        "Longitude": 8.03240367976834,
        "Latitude": 46.357626084422
      },
      {
        "Gemeinde": "Ausserberg",
        "Longitude": 7.85147436696158,
        "Latitude": 46.3143497247332
      },
      {
        "Gemeinde": "Blatten",
        "Longitude": 7.81976383439106,
        "Latitude": 46.4206122826464
      },
      {
        "Gemeinde": "Bürchen",
        "Longitude": 7.81361510161404,
        "Latitude": 46.2838955959866
      },
      {
        "Gemeinde": "Eischoll",
        "Longitude": 7.77994222452752,
        "Latitude": 46.2938982804842
      },
      {
        "Gemeinde": "Ferden",
        "Longitude": 7.75976896784925,
        "Latitude": 46.393809517285
      },
      {
        "Gemeinde": "Kippel",
        "Longitude": 7.77280389697829,
        "Latitude": 46.3991691603381
      },
      {
        "Gemeinde": "Niedergesteln",
        "Longitude": 7.78136397610139,
        "Latitude": 46.3136849529662
      },
      {
        "Gemeinde": "Raron",
        "Longitude": 7.80081954801055,
        "Latitude": 46.3109257008801
      },
      {
        "Gemeinde": "Unterbäch",
        "Longitude": 7.79934897424602,
        "Latitude": 46.2848419663089
      },
      {
        "Gemeinde": "Wiler (Lötschen)",
        "Longitude": 7.78453909276156,
        "Latitude": 46.4045319171767
      },
      {
        "Gemeinde": "Mörel-Filet",
        "Longitude": 8.04538567666199,
        "Latitude": 46.3566576136718
      },
      {
        "Gemeinde": "Steg-Hohtenn",
        "Longitude": 7.74890947311911,
        "Latitude": 46.3137786288527
      },
      {
        "Gemeinde": "Bettmeralp",
        "Longitude": 8.07030081640254,
        "Latitude": 46.3763115020234
      },
      {
        "Gemeinde": "Collonges",
        "Longitude": 7.03595072958831,
        "Latitude": 46.1713527229559
      },
      {
        "Gemeinde": "Dorénaz",
        "Longitude": 7.04388228932533,
        "Latitude": 46.1488909375744
      },
      {
        "Gemeinde": "Evionnaz",
        "Longitude": 7.02424250727636,
        "Latitude": 46.1785067778886
      },
      {
        "Gemeinde": "Finhaut",
        "Longitude": 6.97713745682802,
        "Latitude": 46.0829692693229
      },
      {
        "Gemeinde": "Massongex",
        "Longitude": 6.99004806550086,
        "Latitude": 46.2422449923949
      },
      {
        "Gemeinde": "Saint-Maurice",
        "Longitude": 7.0045032349358,
        "Latitude": 46.2180131183742
      },
      {
        "Gemeinde": "Salvan",
        "Longitude": 7.02209299669291,
        "Latitude": 46.1209261766752
      },
      {
        "Gemeinde": "Vernayaz",
        "Longitude": 7.04139768919911,
        "Latitude": 46.1344888188419
      },
      {
        "Gemeinde": "Vérossaz",
        "Longitude": 6.98382126630572,
        "Latitude": 46.2116346268973
      },
      {
        "Gemeinde": "Chalais",
        "Longitude": 7.50738141958103,
        "Latitude": 46.265605207916
      },
      {
        "Gemeinde": "Chippis",
        "Longitude": 7.54242793500083,
        "Latitude": 46.2790723645681
      },
      {
        "Gemeinde": "Grône",
        "Longitude": 7.45549493194835,
        "Latitude": 46.2512316804847
      },
      {
        "Gemeinde": "Icogne",
        "Longitude": 7.43863739725834,
        "Latitude": 46.2908136517194
      },
      {
        "Gemeinde": "Lens",
        "Longitude": 7.44642108191884,
        "Latitude": 46.2791190117427
      },
      {
        "Gemeinde": "Miège",
        "Longitude": 7.54638664192827,
        "Latitude": 46.3123538529093
      },
      {
        "Gemeinde": "Saint-Léonard",
        "Longitude": 7.41918602871525,
        "Latitude": 46.2539297251169
      },
      {
        "Gemeinde": "Sierre",
        "Longitude": 7.53337305319584,
        "Latitude": 46.2943736977696
      },
      {
        "Gemeinde": "Venthône",
        "Longitude": 7.52950126337744,
        "Latitude": 46.306970424809
      },
      {
        "Gemeinde": "Veyras",
        "Longitude": 7.53728128511897,
        "Latitude": 46.3024663369496
      },
      {
        "Gemeinde": "Anniviers",
        "Longitude": 7.57590899045941,
        "Latitude": 46.1791831388611
      },
      {
        "Gemeinde": "Crans-Montana",
        "Longitude": 7.49576217082758,
        "Latitude": 46.3159879007428
      },
      {
        "Gemeinde": "Arbaz",
        "Longitude": 7.38415472410789,
        "Latitude": 46.2728097165284
      },
      {
        "Gemeinde": "Grimisuat",
        "Longitude": 7.38416708141458,
        "Latitude": 46.2602154961451
      },
      {
        "Gemeinde": "Savièse",
        "Longitude": 7.34787081904189,
        "Latitude": 46.2493969930814
      },
      {
        "Gemeinde": "Sion",
        "Longitude": 7.36086266147507,
        "Latitude": 46.2323148941765
      },
      {
        "Gemeinde": "Veysonnaz",
        "Longitude": 7.33759725603042,
        "Latitude": 46.1963140500855
      },
      {
        "Gemeinde": "Baltschieder",
        "Longitude": 7.86441445836341,
        "Latitude": 46.3089044754741
      },
      {
        "Gemeinde": "Eisten",
        "Longitude": 7.89335941787645,
        "Latitude": 46.1999414079947
      },
      {
        "Gemeinde": "Embd",
        "Longitude": 7.83646929162824,
        "Latitude": 46.2154488665634
      },
      {
        "Gemeinde": "Grächen",
        "Longitude": 7.83890903624155,
        "Latitude": 46.1947496216789
      },
      {
        "Gemeinde": "Lalden",
        "Longitude": 7.90328099320158,
        "Latitude": 46.2997554985291
      },
      {
        "Gemeinde": "Randa",
        "Longitude": 7.78520342527866,
        "Latitude": 46.1013731820727
      },
      {
        "Gemeinde": "Saas-Almagell",
        "Longitude": 7.958430354843,
        "Latitude": 46.0953099851214
      },
      {
        "Gemeinde": "Saas-Balen",
        "Longitude": 7.92793036117276,
        "Latitude": 46.1548197456431
      },
      {
        "Gemeinde": "Saas-Fee",
        "Longitude": 7.92621026979532,
        "Latitude": 46.1071488686082
      },
      {
        "Gemeinde": "Saas-Grund",
        "Longitude": 7.93799807502348,
        "Latitude": 46.1232896222815
      },
      {
        "Gemeinde": "St. Niklaus",
        "Longitude": 7.80251229505494,
        "Latitude": 46.1759815641461
      },
      {
        "Gemeinde": "Stalden (VS)",
        "Longitude": 7.87030379096344,
        "Latitude": 46.2333162752227
      },
      {
        "Gemeinde": "Staldenried",
        "Longitude": 7.88194096874785,
        "Latitude": 46.229672926044
      },
      {
        "Gemeinde": "Täsch",
        "Longitude": 7.77852431810381,
        "Latitude": 46.0672096305381
      },
      {
        "Gemeinde": "Törbel",
        "Longitude": 7.8508934914339,
        "Latitude": 46.2378869526163
      },
      {
        "Gemeinde": "Visp",
        "Longitude": 7.88375346908774,
        "Latitude": 46.2926374165528
      },
      {
        "Gemeinde": "Visperterminen",
        "Longitude": 7.902922857756,
        "Latitude": 46.2583769094837
      },
      {
        "Gemeinde": "Zeneggen",
        "Longitude": 7.86542981082055,
        "Latitude": 46.2729170295198
      },
      {
        "Gemeinde": "Zermatt",
        "Longitude": 7.74723888820179,
        "Latitude": 46.0196236092559
      },
      {
        "Gemeinde": "Boudry",
        "Longitude": 6.83831979414676,
        "Latitude": 46.9495071930028
      },
      {
        "Gemeinde": "Corcelles-Cormondrèche",
        "Longitude": 6.86686340740252,
        "Latitude": 46.9829370129314
      },
      {
        "Gemeinde": "Cortaillod",
        "Longitude": 6.84628084332359,
        "Latitude": 46.9423523824996
      },
      {
        "Gemeinde": "Peseux",
        "Longitude": 6.88916131537617,
        "Latitude": 46.987543809704
      },
      {
        "Gemeinde": "Rochefort",
        "Longitude": 6.81039861140245,
        "Latitude": 46.9781431718814
      },
      {
        "Gemeinde": "Milvignes",
        "Longitude": 6.86047574467382,
        "Latitude": 46.9658135263723
      },
      {
        "Gemeinde": "La Grande-Béroche",
        "Longitude": 6.81489549509704,
        "Latitude": 46.930491280557
      },
      {
        "Gemeinde": "La Chaux-de-Fonds",
        "Longitude": 6.82475811306998,
        "Latitude": 47.1014585206592
      },
      {
        "Gemeinde": "Les Planchettes",
        "Longitude": 6.77068237036033,
        "Latitude": 47.1065539649406
      },
      {
        "Gemeinde": "La Sagne",
        "Longitude": 6.79915436761979,
        "Latitude": 47.0392497257293
      },
      {
        "Gemeinde": "Les Brenets",
        "Longitude": 6.70532977651083,
        "Latitude": 47.0683724524175
      },
      {
        "Gemeinde": "La Brévine",
        "Longitude": 6.60664093510659,
        "Latitude": 46.9804398548902
      },
      {
        "Gemeinde": "Brot-Plamboz",
        "Longitude": 6.73820826537926,
        "Latitude": 46.9705265494467
      },
      {
        "Gemeinde": "Le Cerneux-Péquignot",
        "Longitude": 6.66526276029801,
        "Latitude": 47.0168336611858
      },
      {
        "Gemeinde": "La Chaux-du-Milieu",
        "Longitude": 6.70213668511614,
        "Latitude": 47.0134783588681
      },
      {
        "Gemeinde": "Le Locle",
        "Longitude": 6.74892377207914,
        "Latitude": 47.056949421632
      },
      {
        "Gemeinde": "Les Ponts-de-Martel",
        "Longitude": 6.72995615236439,
        "Latitude": 46.9983618896232
      },
      {
        "Gemeinde": "Cornaux",
        "Longitude": 7.02021861036147,
        "Latitude": 47.0384727452539
      },
      {
        "Gemeinde": "Cressier (NE)",
        "Longitude": 7.03722952056474,
        "Latitude": 47.051126947568
      },
      {
        "Gemeinde": "Enges",
        "Longitude": 7.01218111768659,
        "Latitude": 47.0564332511822
      },
      {
        "Gemeinde": "Hauterive (NE)",
        "Longitude": 6.97174642285289,
        "Latitude": 47.0139974229215
      },
      {
        "Gemeinde": "Le Landeron",
        "Longitude": 7.06484083583061,
        "Latitude": 47.054818417061
      },
      {
        "Gemeinde": "Lignières",
        "Longitude": 7.06464614694012,
        "Latitude": 47.0827026617702
      },
      {
        "Gemeinde": "Neuchâtel",
        "Longitude": 6.92986734219638,
        "Latitude": 46.9922299967738
      },
      {
        "Gemeinde": "Saint-Blaise",
        "Longitude": 6.98621378755776,
        "Latitude": 47.0140557231315
      },
      {
        "Gemeinde": "La Tène",
        "Longitude": 7.00727134053735,
        "Latitude": 47.0123378424509
      },
      {
        "Gemeinde": "Valangin",
        "Longitude": 6.90597247749562,
        "Latitude": 47.0155093305035
      },
      {
        "Gemeinde": "Val-de-Ruz",
        "Longitude": 6.92128498108235,
        "Latitude": 47.0641536874267
      },
      {
        "Gemeinde": "La Côte-aux-Fées",
        "Longitude": 6.49036655001388,
        "Latitude": 46.8661887785581
      },
      {
        "Gemeinde": "Les Verrières",
        "Longitude": 6.48313751637292,
        "Latitude": 46.9039110102663
      },
      {
        "Gemeinde": "Val-de-Travers",
        "Longitude": 6.58290543907473,
        "Latitude": 46.9029029081224
      },
      {
        "Gemeinde": "Aire-la-Ville",
        "Longitude": 6.04356626996233,
        "Latitude": 46.1904280678482
      },
      {
        "Gemeinde": "Anières",
        "Longitude": 6.22301374218108,
        "Latitude": 46.2761747569901
      },
      {
        "Gemeinde": "Avully",
        "Longitude": 6.00135147058992,
        "Latitude": 46.1701041795916
      },
      {
        "Gemeinde": "Avusy",
        "Longitude": 6.00980302907974,
        "Latitude": 46.1441200735292
      },
      {
        "Gemeinde": "Bardonnex",
        "Longitude": 6.10544917455974,
        "Latitude": 46.1497908143702
      },
      {
        "Gemeinde": "Bellevue",
        "Longitude": 6.15473379339308,
        "Latitude": 46.2556260313655
      },
      {
        "Gemeinde": "Bernex",
        "Longitude": 6.07373617619934,
        "Latitude": 46.1755023157223
      },
      {
        "Gemeinde": "Carouge (GE)",
        "Longitude": 6.13957652239599,
        "Latitude": 46.1843775806618
      },
      {
        "Gemeinde": "Cartigny",
        "Longitude": 6.01938182837175,
        "Latitude": 46.1739314712215
      },
      {
        "Gemeinde": "Céligny",
        "Longitude": 6.19536142811519,
        "Latitude": 46.3505505679056
      },
      {
        "Gemeinde": "Chancy",
        "Longitude": 5.97210988742094,
        "Latitude": 46.1499337954647
      },
      {
        "Gemeinde": "Chêne-Bougeries",
        "Longitude": 6.1871993522216,
        "Latitude": 46.1975114755943
      },
      {
        "Gemeinde": "Chêne-Bourg",
        "Longitude": 6.19505309724486,
        "Latitude": 46.1939999200659
      },
      {
        "Gemeinde": "Choulex",
        "Longitude": 6.22545585243535,
        "Latitude": 46.224919189445
      },
      {
        "Gemeinde": "Collex-Bossy",
        "Longitude": 6.1206492725311,
        "Latitude": 46.2705296080103
      },
      {
        "Gemeinde": "Collonge-Bellerive",
        "Longitude": 6.19916828978969,
        "Latitude": 46.2408276705975
      },
      {
        "Gemeinde": "Cologny",
        "Longitude": 6.18285668130476,
        "Latitude": 46.2172557644708
      },
      {
        "Gemeinde": "Confignon",
        "Longitude": 6.08543333842219,
        "Latitude": 46.1738440392645
      },
      {
        "Gemeinde": "Corsier (GE)",
        "Longitude": 6.2246123964602,
        "Latitude": 46.2626968457803
      },
      {
        "Gemeinde": "Dardagny",
        "Longitude": 5.99553016102768,
        "Latitude": 46.1943225589985
      },
      {
        "Gemeinde": "Genève",
        "Longitude": 6.14296896496765,
        "Latitude": 46.2051089279498
      },
      {
        "Gemeinde": "Genthod",
        "Longitude": 6.15579593627914,
        "Latitude": 46.2655351198399
      },
      {
        "Gemeinde": "Le Grand-Saconnex",
        "Longitude": 6.12413673677476,
        "Latitude": 46.2336811746687
      },
      {
        "Gemeinde": "Gy",
        "Longitude": 6.25726881452704,
        "Latitude": 46.2522470557842
      },
      {
        "Gemeinde": "Hermance",
        "Longitude": 6.24451188278348,
        "Latitude": 46.301595004118
      },
      {
        "Gemeinde": "Jussy",
        "Longitude": 6.2654372112194,
        "Latitude": 46.2343386019402
      },
      {
        "Gemeinde": "Laconnex",
        "Longitude": 6.03667627478877,
        "Latitude": 46.1561535967765
      },
      {
        "Gemeinde": "Lancy",
        "Longitude": 6.11870508787259,
        "Latitude": 46.1904330675045
      },
      {
        "Gemeinde": "Meinier",
        "Longitude": 6.23404945480747,
        "Latitude": 46.2466036663193
      },
      {
        "Gemeinde": "Meyrin",
        "Longitude": 6.07240406902041,
        "Latitude": 46.2285681189999
      },
      {
        "Gemeinde": "Onex",
        "Longitude": 6.09815919598081,
        "Latitude": 46.1829929438713
      },
      {
        "Gemeinde": "Perly-Certoux",
        "Longitude": 6.08974129607144,
        "Latitude": 46.1568012796117
      },
      {
        "Gemeinde": "Plan-les-Ouates",
        "Longitude": 6.1179325795432,
        "Latitude": 46.1688314668517
      },
      {
        "Gemeinde": "Pregny-Chambésy",
        "Longitude": 6.14338603906912,
        "Latitude": 46.2420007846568
      },
      {
        "Gemeinde": "Presinge",
        "Longitude": 6.2593071528152,
        "Latitude": 46.2180803050508
      },
      {
        "Gemeinde": "Puplinge",
        "Longitude": 6.23097905696845,
        "Latitude": 46.2096840639157
      },
      {
        "Gemeinde": "Russin",
        "Longitude": 6.01385066042555,
        "Latitude": 46.18735749262
      },
      {
        "Gemeinde": "Satigny",
        "Longitude": 6.03257826001655,
        "Latitude": 46.2145837037904
      },
      {
        "Gemeinde": "Soral",
        "Longitude": 6.04344719060738,
        "Latitude": 46.1445411936173
      },
      {
        "Gemeinde": "Thônex",
        "Longitude": 6.19776650948144,
        "Latitude": 46.188631797027
      },
      {
        "Gemeinde": "Troinex",
        "Longitude": 6.14919543001719,
        "Latitude": 46.1610965815283
      },
      {
        "Gemeinde": "Vandoeuvres",
        "Longitude": 6.20221078154129,
        "Latitude": 46.2210681513392
      },
      {
        "Gemeinde": "Vernier",
        "Longitude": 6.08699522443741,
        "Latitude": 46.2152486446932
      },
      {
        "Gemeinde": "Versoix",
        "Longitude": 6.16058004759523,
        "Latitude": 46.282682734495
      },
      {
        "Gemeinde": "Veyrier",
        "Longitude": 6.18531342456082,
        "Latitude": 46.1669022085698
      },
      {
        "Gemeinde": "Boécourt",
        "Longitude": 7.2149708348711,
        "Latitude": 47.3493380322086
      },
      {
        "Gemeinde": "Bourrignon",
        "Longitude": 7.2452366285295,
        "Latitude": 47.3970628739851
      },
      {
        "Gemeinde": "Châtillon (JU)",
        "Longitude": 7.34338376143835,
        "Latitude": 47.3270299208234
      },
      {
        "Gemeinde": "Courchapoix",
        "Longitude": 7.45583547252179,
        "Latitude": 47.3486547811535
      },
      {
        "Gemeinde": "Courrendlin",
        "Longitude": 7.37379578705666,
        "Latitude": 47.3387437884277
      },
      {
        "Gemeinde": "Courroux",
        "Longitude": 7.37509127997058,
        "Latitude": 47.3612307960547
      },
      {
        "Gemeinde": "Courtételle",
        "Longitude": 7.31821934176636,
        "Latitude": 47.3404983865524
      },
      {
        "Gemeinde": "Delémont",
        "Longitude": 7.34596527371074,
        "Latitude": 47.3639088380931
      },
      {
        "Gemeinde": "Develier",
        "Longitude": 7.29435980471556,
        "Latitude": 47.3557611071565
      },
      {
        "Gemeinde": "Ederswiler",
        "Longitude": 7.33525376954528,
        "Latitude": 47.4259598408785
      },
      {
        "Gemeinde": "Mervelier",
        "Longitude": 7.50214867840495,
        "Latitude": 47.3432416899889
      },
      {
        "Gemeinde": "Mettembert",
        "Longitude": 7.32206184357939,
        "Latitude": 47.3980653016684
      },
      {
        "Gemeinde": "Movelier",
        "Longitude": 7.3167363291415,
        "Latitude": 47.4097523074574
      },
      {
        "Gemeinde": "Pleigne",
        "Longitude": 7.29024551053517,
        "Latitude": 47.4070230615915
      },
      {
        "Gemeinde": "Rossemaison",
        "Longitude": 7.34202690441514,
        "Latitude": 47.3459168796134
      },
      {
        "Gemeinde": "Saulcy",
        "Longitude": 7.15434716668296,
        "Latitude": 47.3015336340985
      },
      {
        "Gemeinde": "Soyhières",
        "Longitude": 7.36975541972323,
        "Latitude": 47.3927072794292
      },
      {
        "Gemeinde": "Haute-Sorne",
        "Longitude": 7.24545282662675,
        "Latitude": 47.3377007409939
      },
      {
        "Gemeinde": "Val Terbi",
        "Longitude": 7.41480959582643,
        "Latitude": 47.348653713709
      },
      {
        "Gemeinde": "Le Bémont (JU)",
        "Longitude": 7.01448411520933,
        "Latitude": 47.2642256209942
      },
      {
        "Gemeinde": "Les Bois",
        "Longitude": 6.90568781797212,
        "Latitude": 47.1765233800324
      },
      {
        "Gemeinde": "Les Breuleux",
        "Longitude": 7.00433841270136,
        "Latitude": 47.2120185555762
      },
      {
        "Gemeinde": "La Chaux-des-Breuleux",
        "Longitude": 7.0280156984355,
        "Latitude": 47.2228992231058
      },
      {
        "Gemeinde": "Les Enfers",
        "Longitude": 7.04470148892955,
        "Latitude": 47.287718952254
      },
      {
        "Gemeinde": "Les Genevez (JU)",
        "Longitude": 7.12948552756394,
        "Latitude": 47.2564967053144
      },
      {
        "Gemeinde": "Lajoux (JU)",
        "Longitude": 7.1372850562515,
        "Latitude": 47.27900388566
      },
      {
        "Gemeinde": "Montfaucon",
        "Longitude": 7.05267186903334,
        "Latitude": 47.2823492423482
      },
      {
        "Gemeinde": "Muriaux",
        "Longitude": 6.97896392118318,
        "Latitude": 47.2461000155088
      },
      {
        "Gemeinde": "Le Noirmont",
        "Longitude": 6.9567041493776,
        "Latitude": 47.2244218671422
      },
      {
        "Gemeinde": "Saignelégier",
        "Longitude": 6.99605299431421,
        "Latitude": 47.2560610110788
      },
      {
        "Gemeinde": "Saint-Brais",
        "Longitude": 7.11333031503577,
        "Latitude": 47.3059223338384
      },
      {
        "Gemeinde": "Soubey",
        "Longitude": 7.04851573090544,
        "Latitude": 47.3084192261713
      },
      {
        "Gemeinde": "Alle",
        "Longitude": 7.13115140616551,
        "Latitude": 47.4255966480693
      },
      {
        "Gemeinde": "Beurnevésin",
        "Longitude": 7.13739495377139,
        "Latitude": 47.493068040609
      },
      {
        "Gemeinde": "Boncourt",
        "Longitude": 7.01660880643956,
        "Latitude": 47.4962873623649
      },
      {
        "Gemeinde": "Bonfol",
        "Longitude": 7.15340659000917,
        "Latitude": 47.4769197415761
      },
      {
        "Gemeinde": "Bure",
        "Longitude": 7.00644004798788,
        "Latitude": 47.4413853085757
      },
      {
        "Gemeinde": "Coeuve",
        "Longitude": 7.09783917541548,
        "Latitude": 47.4533839699945
      },
      {
        "Gemeinde": "Cornol",
        "Longitude": 7.16438781339571,
        "Latitude": 47.4058930621609
      },
      {
        "Gemeinde": "Courchavon",
        "Longitude": 7.05682957512574,
        "Latitude": 47.4397641105794
      },
      {
        "Gemeinde": "Courgenay",
        "Longitude": 7.12598216933097,
        "Latitude": 47.4030967664974
      },
      {
        "Gemeinde": "Courtedoux",
        "Longitude": 7.04247595288026,
        "Latitude": 47.409135440421
      },
      {
        "Gemeinde": "Damphreux",
        "Longitude": 7.10300109615713,
        "Latitude": 47.4758843798009
      },
      {
        "Gemeinde": "Fahy",
        "Longitude": 6.95230089748975,
        "Latitude": 47.4177846565737
      },
      {
        "Gemeinde": "Fontenais",
        "Longitude": 7.08093939538848,
        "Latitude": 47.4029652841902
      },
      {
        "Gemeinde": "Grandfontaine",
        "Longitude": 6.93929507692028,
        "Latitude": 47.3916454030453
      },
      {
        "Gemeinde": "Lugnez",
        "Longitude": 7.09764267110859,
        "Latitude": 47.4839632685113
      },
      {
        "Gemeinde": "Porrentruy",
        "Longitude": 7.07819880795777,
        "Latitude": 47.4164484254521
      },
      {
        "Gemeinde": "Vendlincourt",
        "Longitude": 7.1495692875536,
        "Latitude": 47.4508273688178
      },
      {
        "Gemeinde": "Basse-Allaine",
        "Longitude": 7.03133143523864,
        "Latitude": 47.4801505928805
      },
      {
        "Gemeinde": "Clos du Doubs",
        "Longitude": 7.16193993811653,
        "Latitude": 47.3672116106697
      },
      {
        "Gemeinde": "Haute-Ajoie",
        "Longitude": 7.00154472514183,
        "Latitude": 47.3918984882377
      },
      {
        "Gemeinde": "La Baroche",
        "Longitude": 7.20538263261668,
        "Latitude": 47.4230723414089
      }
     ]
  ]
}
