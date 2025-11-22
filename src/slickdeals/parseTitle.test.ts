import { describe, it, expect } from 'vitest';
import { parseTitle } from "./index";

const data = [
    {
        "name": "adidas Men's Lite Racer Adapt 7.0 Shoes (3 colors)",
        "price": "$28",
        "note": ""
    },
    {
        "name": "Sony WH-1000XM4 Noise Cancelling Wireless Over-the-Ear Headphones (3 Colors)",
        "price": "$160",
        "note": "+ Free Shipping"
    },
    {
        "name": "Costco Members: Frigidaire Gallery Nugget Ice Maker (44-lbs, Black)",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "Wanlipo A13 4K + 1080p Dual Channel WiFi IPS Dash Cam w/ 64GB microSD Card",
        "price": "$28",
        "note": ""
    },
    {
        "name": "12-Pack 19-Oz Progresso Traditional Canned Soup (Beef Barley)",
        "price": "$9.35",
        "note": ""
    },
    {
        "name": "15.6\" AOC 16T20 1080p FHD IPS Portable Monitor w/ Smart Cover",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Rad Power Bikes Radster Trail Electric Bike (Large, Copper Red)",
        "price": "$799",
        "note": "+ Free Shipping"
    },
    {
        "name": "OUPES Mega 2 2500W, 2048Wh Solar Generator LiFePO4 + 240W Solar Panel + 6 Yr Warranty $819 + Free S/H",
        "price": "$819",
        "note": ""
    },
    {
        "name": "Gigabyte Gaming A16 Laptop: i7-13620H, 16\" 1200p 165Hz, RTX 4050, 16GB DDR5",
        "price": "$600",
        "note": "+ Free Shipping"
    },
    {
        "name": "Lenovo 1080p 300 FHD Webcam (White or Black)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "GENDOME 200W IP68 Foldable Portable Solar Panel",
        "price": "$99",
        "note": "+ Free Shipping"
    },
    {
        "name": "eufy Security eufycam C35 4-Cam Kit $200 & More + FS",
        "price": "$200",
        "note": ""
    },
    {
        "name": "40-Oz Technivorm Moccamaster 79112 KBT Coffee Brewer (Silver)",
        "price": "$160",
        "note": "+ Free Shipping"
    },
    {
        "name": "25W Samsung Super Fast Charging Wall Charger with USB-C Cable (Black)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Columbia Men's Casual Everyday Leather Belt (Select Sizes/Colors)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "26\" 5TH WHEEL AB17 500W Electric Bike, up to 23mph / 45 miles",
        "price": "$214",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: eufy Security SoloCam S340",
        "price": "$110",
        "note": "+ Free Shipping"
    },
    {
        "name": "2-Piece Cuisinart Green Gourmet Bamboo Solid & Slotted Spoons",
        "price": "$4.40",
        "note": ""
    },
    {
        "name": "34\" Sceptre C345B 3440x1440 UWQHD 165Hz 1ms Curved Ultrawide VA Monitor",
        "price": "$188",
        "note": "+ Free Shipping"
    },
    {
        "name": "26\" AMYET EB26 1500W Peak 48V 15AH Adult Electric Fat Tire Bike",
        "price": "$321",
        "note": "+ Free Shipping"
    },
    {
        "name": "ASUS 750W ROG STRIX 80+ Gold Aura Edition Full Modular Power Supply",
        "price": "$80",
        "note": "+ Free Shipping"
    },
    {
        "name": "11-Ounce Tree Hut Serum Infused Hand Wash (Various Scents)",
        "price": "from $3.80",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Slickdeals Daily Draw Giveaway – Enter Now for a Chance to Win!",
        "price": "(See Official Rules)",
        "note": ""
    },
    {
        "name": "Jackery Explorer 2000 v2 LiFePO4 2042Wh / 2200W Portable Power Station",
        "price": "$699",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Lb Ocean Spray Craisins Dried Cranberries",
        "price": "$5.35",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Open Box Fair-Excellent: Apple AirPods Max ANC Wireless Headphones w/ Smart Case",
        "price": "from $310",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "New Open Box: Google Pixel Fold 5G Smartphone (Unlocked): 512GB $425, 256GB",
        "price": "$400",
        "note": "+ Free S/H for Prime Members"
    },
    {
        "name": "New/Select Returning Members: 3-Months Audible Premium Plus + $20 Credit",
        "price": "$1/month",
        "note": ""
    },
    {
        "name": "24-Piece Bluey's Advent Calendar Pack (Amazon Exclusive)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "8-Pack 12-Oz BODYARMOR Sports Drink ZERO Sugar (Watermelon Strawberry)",
        "price": "$4.05",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "20\" Samsonite Omni Hardside Expandable Carry-On Luggage w/ Spinner Wheels (Silver)",
        "price": "$67",
        "note": "+ Free Shipping"
    },
    {
        "name": "Refurbished: Dyson V15 Detect Total Clean Extra Cordless Stick Vacuum",
        "price": "$300",
        "note": "+ Free Shipping"
    },
    {
        "name": "15-Count BODYARMOR Flash IV Electrolyte Packets (Tropical Punch)",
        "price": "$6.50",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "eufy Security S220 SoloCam 2K Solar Wireless Outdoor Camera",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Thames & Kosmos Mega Cyborg Hand STEM Experiment Kit",
        "price": "$16",
        "note": ""
    },
    {
        "name": "ANYCUBIC Kobra 3 Combo AE Version Multi-Color FDM 3D Printer",
        "price": "$204",
        "note": "+ Free Shipping"
    },
    {
        "name": "100oz. Bodewell Free & Clear Liquid Laundry Detergent",
        "price": "$4.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "Hasbro Winning Moves Scrabble Slam Card Game",
        "price": "2 for $6",
        "note": ""
    },
    {
        "name": "2-Pk BOSCH 26A18A ICON Beam Wiper Blades (26A & 18A)",
        "price": "$39",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Costco: ASUS Vivobook Flip Laptop: 14\" 1200p OLED Touch, Ultra 7 256V, 16GB RAM",
        "price": "$715",
        "note": ""
    },
    {
        "name": "10-Cup Zojirushi Induction Rice Cooker & Warmer (Black)",
        "price": "$255",
        "note": "+ Free Shipping"
    },
    {
        "name": "Neat Bumblebee II Professional Cardioid Directional USB Condenser Microphone",
        "price": "$15",
        "note": "+ Free Shipping w/ Prime"
    },
    {
        "name": "5-Pack 10-Oz Kicking Horse Organic Medium Roast Whole Bean Coffee (Three Sisters)",
        "price": "$24",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Baseus Inspire XC1 Open Ear Clip-On Earbuds w/ Sound by Bose & Dolby Spatial Audio $89.99 + Free Shipping",
        "price": "$90",
        "note": ""
    },
    {
        "name": "5-Pack Hanes Men's Cool DRI Performance T-Shirts (Select Colors/Sizes)",
        "price": "$22",
        "note": ""
    },
    {
        "name": "Play-Doh Rainbow Swirl Ice Cream Playset w/ 7 Kitchen Accessories",
        "price": "$11",
        "note": ""
    },
    {
        "name": "Prime Members: 256GB Motorola Moto G Stylus 5G Unlocked Smartphone (2024)",
        "price": "from $180",
        "note": "+ Free Shipping"
    },
    {
        "name": "Jackery Explorer 1000 v2 1070Wh 1500W LiFePO4 Portable Power Station",
        "price": "$332",
        "note": "+ Free Shipping"
    },
    {
        "name": "5-Bay ORICO USB 3.0 Hard Drive Docking Station with Offline Cloning",
        "price": "$61",
        "note": "+ Free Shipping"
    },
    {
        "name": "Milwaukee REDLITHIUM Battery Packs: M12 High Output XC5.0 Battery",
        "price": "$60",
        "note": "& More + Free S/H $99+ Orders"
    },
    {
        "name": "Milwaukee M12 FUEL Oscillating Multi-Tool (Tool Only)",
        "price": "$99",
        "note": "+ Free Shipping"
    },
    {
        "name": "adidas Black Friday Deals: Up To 60% Off Select Shoes, Clothing & Accessories + Free Shipping",
        "price": "",
        "note": ""
    },
    {
        "name": "12-Month Xbox Game Pass Core Membership",
        "price": "$60",
        "note": "(Email Delivery)"
    },
    {
        "name": "20-Piece T-Fal Refresh Nonstick Ceramic Cookware Set",
        "price": "from $89.95",
        "note": "+ Free Shipping"
    },
    {
        "name": "2TB Sony PlayStation 5 Pro Game Console",
        "price": "$649",
        "note": "+ Free Shipping"
    },
    {
        "name": "Flashforge AD5X Multi-Color 3D Printer w/ Auto Leveling Control",
        "price": "$239",
        "note": "+ Free S/H"
    },
    {
        "name": "16GB Amazon Kindle Colorsoft eReader (Black)",
        "price": "$170",
        "note": "& More + Free Shipping"
    },
    {
        "name": "6-Piece Cuisinart Stainless Steel Magnetic Measuring Spoons Set",
        "price": "$7.95",
        "note": ""
    },
    {
        "name": "Worx 4V 3-Speed 1/4\" Cordless Electric Screwdriver w/ Storage Box",
        "price": "$20",
        "note": "+ Free Shipping"
    },
    {
        "name": "Alienware 16 Aurora Laptop: 16\" 2560x1600 120Hz, Core 7 240H, RTX 5060, 32GB RAM",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "adidas Men's Kaptir 4.0 Sneakers",
        "price": "$45",
        "note": "+ Free Shipping"
    },
    {
        "name": "Destroy All Humans! 2 Reprobed (Xbox Series X)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Star Wars: Jedi Fallen Order + Jedi: Survivor (PS4/PS5 Digital Download)",
        "price": "$16",
        "note": ""
    },
    {
        "name": "Baseus Bass BC1 Open Ear Earbuds (3 Colors) $18.99 + Free Shipping w/ Prime or on $35+",
        "price": "$19",
        "note": ""
    },
    {
        "name": "20-Oz Stanley Tough-To-Tip Admiral's Mug / Coffee Cup (Cream Gloss)",
        "price": "$19",
        "note": ""
    },
    {
        "name": "120-Piece Mentos Pure Fresh Sugar Free Chewing Gum (Spearmint)",
        "price": "$1.65",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Amazon Essentials Men's Fleece Crewneck Sweatshirt (Pink)",
        "price": "$6.45",
        "note": ""
    },
    {
        "name": "$84.99*:4-Piece Tripcomp Luggage Suitcase Set (14/20/24/28)Hardside Suitcase with Spinner Wheels Lightweight Carry on Luggage (various color)",
        "price": "$85",
        "note": ""
    },
    {
        "name": "PC Digital Games: Shin Megami Tensei V: Vengeance $20.10, Judgment",
        "price": "$10",
        "note": "& More"
    },
    {
        "name": "New Mint Mobile Customers: 128GB Samsung Galaxy A16 5G + 12-Mo Unlimited Plan",
        "price": "$195",
        "note": "+ Free Shipping"
    },
    {
        "name": "Casio Men's W96H-4AV 35.89mm Classic Digital Quartz Watch w/ Black Band",
        "price": "$18",
        "note": ""
    },
    {
        "name": "New Mint Mobile Customers: 128GB Samsung Galaxy S25 + 12-Month Unlimited Plan",
        "price": "$530",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Warhammer: Vermintide 2 (PC Digital Download)",
        "price": "Free",
        "note": ""
    },
    {
        "name": "Halo: The Master Chief Collection (PC/Steam Digital Download)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "128GB Meta Quest 3S VR Headset + $50 Amazon Credit",
        "price": "$250",
        "note": "+ Free Shipping"
    },
    {
        "name": "adidas Men's Galaxy 7 Running Shoes (2 Colors)",
        "price": "$20",
        "note": "+ Free Shipping"
    },
    {
        "name": "16.4' Govee RGBIC LED Indoor Strip Lights",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Prime Members: 100-Pack 11.8\" Self-Locking Stainless Steel Metal Zip Ties",
        "price": "$6.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "Ozark Trail 20L Spring River Waterproof Roll Top Backpack (Red)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "16\" x 31.5\" KLSMYHOKI Portable Standing Desk w/ Adjustable Height",
        "price": "$34",
        "note": "+ Free Shipping"
    },
    {
        "name": "12-Pack 16-Oz Snapple Zero Sugar Peach Tea",
        "price": "$8.55",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Select Accts: 12-Pack 16oz Jif Extra Crunchy Peanut Butter",
        "price": "$13",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Lenovo Legion 5i Laptop: i9-14900HX, 15.1\" WQXGA 165Hz, RTX 5070, 16GB, 512GB",
        "price": "$1,191",
        "note": "+ Free Shipping"
    },
    {
        "name": "12-Month Crunchyroll Anime Streaming Membership: Mega Fan $100 or Fan",
        "price": "$67",
        "note": ""
    },
    {
        "name": "55Lb Pair CAP Barbell ADJUSTABELL Adjustable Hex Dumbbell Weights",
        "price": "$192",
        "note": "+ Free Shipping"
    },
    {
        "name": "Samsung EPP/EDU: 49\" Odyssey G91F 5120x1440p 144Hz VA 1000R Curved Gaming Monitor",
        "price": "$581",
        "note": "w/ 2-Yr Samsung Care+ + Free Shipping"
    },
    {
        "name": "EPP/EDU: Samsung Curved Monitors: 57\" Odyssey Neo G9 240Hz Dual 4K + 24\" S3",
        "price": "$1300 or Less",
        "note": "w/ 2-Yr Samsung Care+ + Free S&H"
    },
    {
        "name": "Fiji: The Pearl Resort & Spa w/ Beach Access: 5-Night Stay for 2",
        "price": "from $909",
        "note": "(Book by 10/1/26, travel thru 10/31)"
    },
    {
        "name": "Ms. Rachel Melissa & Doug Letter, Number, Game Wooden Learning Blocks",
        "price": "$12",
        "note": ""
    },
    {
        "name": "Final Fantasy VII Rebirth Standard Edition (PlayStation 5)",
        "price": "$30",
        "note": "+ Free Shipping"
    },
    {
        "name": "48\" LG Class B5 Series OLED AI 4K UHD 120Hz Smart webOS TV (2025)",
        "price": "$550",
        "note": "+ Free Shipping"
    },
    {
        "name": "6-Pack 8\" Smith & Wesson Bullseye Throwing Knives w/ Nylon Belt Sheath",
        "price": "$25",
        "note": ""
    },
    {
        "name": "Used - Like New: Google Nest Temperature Sensor (2nd Gen)",
        "price": "$23",
        "note": ""
    },
    {
        "name": "27\" Dell 27 Plus S2725QC 3840x2160 120Hz 4ms IPS FreeSync Monitor w/ USB Hub",
        "price": "$260",
        "note": "+ Free Shipping"
    },
    {
        "name": "New QVC Customers: 64GB Tracfone Moto G 2025 + 1-Yr Plan (1500 Talk/Text/Data)",
        "price": "$28",
        "note": "+ Free Shipping"
    },
    {
        "name": "Kid's Halloween Graphic Shirt & Pant Pajama Set (Bluey, Stitch, More)",
        "price": "$3.00",
        "note": ""
    },
    {
        "name": "Under Armour Tech Men's Polo (Black/Graphite)",
        "price": "$21",
        "note": ""
    },
    {
        "name": "50\" TCL Q5-Series 4K UHD HDR PRO+ QLED Smart Fire TV",
        "price": "$180",
        "note": "+ Free Shipping"
    },
    {
        "name": "Total Wireless: Samsung Galaxy A25 5G Smartphone + 2-Month 5G Unlimited Prepaid Plan",
        "price": "$110",
        "note": ""
    },
    {
        "name": "3-Piece Samsonite Voltage DLX Polypropylene Expandable Spinner Luggage Set",
        "price": "$230",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Hanes Moves Performance Men's Moisture-Wicking Short Sleeve Polo Shirt (Various)",
        "price": "from $7.25",
        "note": ""
    },
    {
        "name": "Select PayPal Accts: 512GB Galaxy S25 Ultra 5G Unlocked Smartphone (Titanium Gray)",
        "price": "$750 + 20% Back in PayPal Rewards",
        "note": "+ Free Shipping"
    },
    {
        "name": "Under Armour Men's Tech Golf Polo (Various Colors)",
        "price": "from $19",
        "note": ""
    },
    {
        "name": "Demon's Souls (PlayStation 5)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "Transformers One (4K UHD + Blu-ray + Digital)",
        "price": "$14",
        "note": ""
    },
    {
        "name": "Columbia Men's Snowtrekker II Boots (Black / Graphite)",
        "price": "$55",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: G & F Products Waterproof HPT Palm/Fingers Gloves (Large Only)",
        "price": "$5.95",
        "note": "+ Free Shipping"
    },
    {
        "name": "96-Count Fresh Roasted Coffee The Great Eight K-Cup Coffee Pod Variety Pack",
        "price": "$20",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Prime Members: Torin Professional 14\" Universal Heavy Duty 4-Way Cross Lug Wrench",
        "price": "$5.45",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Pack Energizer Weatheready Rechargeable Plug-In LED Flashlights",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Prime Members: 31″ Alpine Corporation Tall Outdoor Antique Flower Birdbath Yard Statue",
        "price": "$13",
        "note": "+ Free Shipping"
    },
    {
        "name": "10-Piece Fisher-Price Wooden Stack & Sort Animals Toy + $4 Walmart Cash",
        "price": "$8.50",
        "note": ""
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds w/ Active Noise Cancellation & USB-C Case",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "New or Select Returning Subscribers 6 Months of Apple TV",
        "price": "$6 per Month",
        "note": ""
    },
    {
        "name": "12-Pack 12oz Dr Pepper Zero Sugar Soda",
        "price": "$4.65",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Prime Members: 2-Pack 6.6' AINOPE 60W Right Angle USB-C Cable w/ USB-A Adapter",
        "price": "$5.50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Belkin Portable Charger Power Bank 10000 mAh w/ Integrated USB-C Cable",
        "price": "$15",
        "note": ""
    },
    {
        "name": "NordicTrack T Series 6.5S Treadmill",
        "price": "$543",
        "note": "+ Free Shipping"
    },
    {
        "name": "18-Count 8-Oz Horizon Organic Shelf Stable Chocolate Milk Boxes",
        "price": "$10",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "128GB 11\" Apple iPad A16 Chip Wi-Fi Tablet (11th Gen, Early 2025, Various)",
        "price": "$279",
        "note": "& More + Free Shipping"
    },
    {
        "name": "4-Pack 4.5-oz Nongshim Chapagetti Jjajang Ramen Noodles",
        "price": "$4.45",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "32\" ASUS ROG Swift PG32UCDP 4K UHD 240Hz WOLED Dual-Mode Gaming Monitor",
        "price": "$850",
        "note": "+ Free Shipping"
    },
    {
        "name": "Select Cash App Accounts: Savings at Target",
        "price": "20% Off",
        "note": "(Max $20)"
    },
    {
        "name": "Prime Members: One Beat 5x AC 4x USB 3-Prong Outlet Extender w/ 1680J Surge",
        "price": "$7.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: 36W Gaiatop Coffee Mug Warmer w/ 5 Temp Settings & 0.5-9H Timer",
        "price": "$8.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "32oz Drano Liquid Drain Clog Remover and Cleaner",
        "price": "$5.30",
        "note": ""
    },
    {
        "name": "Stellar Blade (PlayStation 5)",
        "price": "$40",
        "note": "+ Free Shipping"
    },
    {
        "name": "Alienware 16 Aurora Laptop: 16\" 2560x1600 120Hz, Core 7 240H, RTX 5060, 32GB RAM",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "4TB Crucial P310 M.2 2280 PCIe Gen4 NVMe Solid State Drive",
        "price": "$240",
        "note": "+ Free Shipping"
    },
    {
        "name": "Silent Hill 2 (PlayStation 5)",
        "price": "$30",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "4K UHD Movies (Physical): A Quiet Place, The Godfather, Team America: World Police",
        "price": "$12.75 Each",
        "note": "& More"
    },
    {
        "name": "Corsair iCUE 5000T RGB Tempered Glass ATX Mid Tower Case w/ 3x RGB LL120 Fans",
        "price": "$90",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: 99' EEW Voice Controlled 300 LED Christmas String Lights (Warm White)",
        "price": "$10",
        "note": "+ Free Shipping"
    },
    {
        "name": "Astro Bot (PS5)",
        "price": "$40",
        "note": "+ Free Shipping"
    },
    {
        "name": "Helldivers 2 (PlayStation 5)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "150-Lb CAP Barbell Rubber Coated Hex Dumbbell Weight Set w/ Vertical Rack",
        "price": "$112",
        "note": "+ Free Shipping"
    },
    {
        "name": "EA SPORTS College Football 25 (Xbox Series X)",
        "price": "$5.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "Skytech Crystal Desktop: Ryzen 7 7700, RX 9060XT, 16GB RAM, 1TB SSD",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "12-Pack 16oz Cellucor C4 Performance Zero Sugar Energy Drink (Strawberry Blast)",
        "price": "$11.10 or less",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Nike Revolution 8 Road Running Shoes (3 Colors): Men's $35.25, Women's",
        "price": "$34",
        "note": "+ Free S/H on $50+ Orders"
    },
    {
        "name": "PowerA Nano Wired Controller w/ Comfort Grip & Case (Pokémon Assortment, Switch)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "6-Count Scotch Heavy Duty Packaging Tape (Clear; 1.88\" x 22.2yd)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "Prime Members: SOG PowerPint Mini Compact Stainless Steel Multi-Tool (Black)",
        "price": "$29.65 or Less",
        "note": "+ Free Shipping"
    },
    {
        "name": "LISEN MagSafe Phone Car Vent Mount (Black)",
        "price": "$7.00",
        "note": ""
    },
    {
        "name": "Sony PlayStation DualSense Wireless Controller (various)",
        "price": "from $55",
        "note": "& More + Free Shipping"
    },
    {
        "name": "71-Gal Keter Marvel Outdoor Storage Resin Deck Box (Brown or Graphite)",
        "price": "$49",
        "note": "+ Free Shipping"
    },
    {
        "name": "Anker 735 Nano II 65W GaN II 3-Port USB Fast Charger",
        "price": "$24",
        "note": ""
    },
    {
        "name": "Men's Hanes EcoSmart Fleece Sweatpants (3 Colors)",
        "price": "$8.40",
        "note": ""
    },
    {
        "name": "50.5mm Casio Men’s MWA100H Series Stainless Steel Analog Watch (Silver)",
        "price": "$39",
        "note": "+ Free Shipping"
    },
    {
        "name": "16-Oz Stanley AeroLight Transit Bottle (3 Colors)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "50-Lbs Pair CAP Barbell Rubber Coated Hex Dumbbell Set (Chrome Handle)",
        "price": "$78",
        "note": "+ Free Shipping"
    },
    {
        "name": "COSRX: 0.67-Oz The Retinol 0.5 Oil + 0.67-Oz The Retinol 0.1% Cream",
        "price": "$14",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Prime Members: 2-Pack Baseus 45W USB-C Charger Blocks w/ 3.3' USB-C Cables",
        "price": "$18",
        "note": "+ Free Shipping"
    },
    {
        "name": "Mario + Rabbids: Kingdom Battle & Sparks of Hope (Switch Digital Code in Box)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Alone in the Dark (PS5)",
        "price": "$25",
        "note": ""
    },
    {
        "name": "Shadow Labyrinth: Secret Edition (PlayStation 5)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "Baseus Enercore CG11 6-in-1 70W GaN Travel Adapter w/ Retractable Cable",
        "price": "$25",
        "note": ""
    },
    {
        "name": "Top Gun: 2-Movie Collection (Top Gun / Top Gun: Maverick, 4K UHD)",
        "price": "$22",
        "note": ""
    },
    {
        "name": "128GB 11\" Apple iPad Air M3 Wi-Fi Tablet (2025, Various Colors)",
        "price": "$449",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Baseus 3-Port 22.5W PD Fast Charging 10000mAh Power Bank w/ Built-in USB-C Cable",
        "price": "$11",
        "note": ""
    },
    {
        "name": "JIUSI PT14R 1/14 4WD Brushless Motor 2.4G Remote Control 35C Off-road RC Truck",
        "price": "$91",
        "note": "+ Free Shipping"
    },
    {
        "name": "Onkyo TX-NR7100 9.2-Channel AV Receiver",
        "price": "$699",
        "note": "+ Free Shipping"
    },
    {
        "name": "Wednesday: The Complete First Season (Blu-Ray)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "Select New Subscribers: 3-Months Kindle Unlimited Digital Subscription",
        "price": "$1.00",
        "note": ""
    },
    {
        "name": "Paramore: Riot! 25th Anniversary Edition (Silver Vinyl LP w/ AutoRip MP3)",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Apple AirPods Max ANC Wireless Over-Ear Headphones w/ Smart Case (Various Colors)",
        "price": "$430",
        "note": "+ Free Shipping"
    },
    {
        "name": "HP Victus Laptop: 15.6\" 1080p 144Hz, Ryzen 7 7445HS, RTX 4050, 16GB RAM",
        "price": "$550",
        "note": "+ Free Shipping"
    },
    {
        "name": "Lutron Caseta Diva Smart Dimmer Switch w/ Wall Plate (White)",
        "price": "$59",
        "note": "+ Free Shipping"
    },
    {
        "name": "8-ct Sharpie Highlighter Clearview Stick w/ Chisel Tip (Assorted Colors)",
        "price": "$7.85",
        "note": ""
    },
    {
        "name": "12-Pack Amazon Basics AAA 800mAh NiMH Rechargeable Batteries",
        "price": "$7.90",
        "note": "w/ Subscribe & Save & More"
    },
    {
        "name": "128GB 11\" Apple iPad Air M3 Wi-Fi Tablet (Blue)",
        "price": "$449",
        "note": "+ Free Shipping"
    },
    {
        "name": "Amazon Resale: Select Used & Open Box Items",
        "price": "15% Off",
        "note": "(Limited Stock)"
    },
    {
        "name": "2-pk 50-fl-oz Amazon Basics Liquid Hand Soap Refill (various)",
        "price": "from $5.35",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "55\" Hisense S7 Series 4K QLED 144Hz Smart CanvasTV w/ UltraSlim Wall Mount",
        "price": "$650",
        "note": "+ Free Shipping"
    },
    {
        "name": "6.6-Oz Goldfish Baked Snack Crackers (Cheddar)",
        "price": "$1.85",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "PowerColor AMD Radeon RX 9070 XT Reaper Triple Fan 16GB PCIe 5.0 Graphics Card",
        "price": "$570",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "100' Daybetter Smart Wi-Fi LED Strip Lights",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Select Home Depot Locations: RYOBI 40V HP 16\" String Trimmer w/ 4.0Ah Batt. & Charger",
        "price": "$97",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "Energizer 10,000mAh Slim Metal 20W Magnetic Wireless MagSafe PowerBank",
        "price": "$16",
        "note": "+ Free Shipping"
    },
    {
        "name": "Used - Like New: Logitech MX Keys S Combo (Performance Wireless Keyboard & Mouse)",
        "price": "$117",
        "note": "+ Free Shipping"
    },
    {
        "name": "GL.iNet GL-BE3600 (Slate 7) Pocket-Sized Wi-Fi 7 Portable Travel Router",
        "price": "$121",
        "note": "+ Free Shipping"
    },
    {
        "name": "Certified Renewed Sonos One SL Wireless Speaker (Shadow Black)",
        "price": "$99",
        "note": "+ Free Shipping"
    },
    {
        "name": "Asmodee 7 Wonders Duel Board Game",
        "price": "$20",
        "note": ""
    },
    {
        "name": "Prime: 4-pk 1KG SUNLU Silk PLA 1.75mm 3D Printer Filament (Various)",
        "price": "$39",
        "note": "+ Free Shipping"
    },
    {
        "name": "Rise of the Ronin (PlayStation 5)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "Select Existing Google Fi Customers: Pixel 10 Pro XL from $699 or Pixel 10 Pro",
        "price": "from $499",
        "note": "(Min. 120 Days Service & Activation Req.)"
    },
    {
        "name": "ASRock AMD Radeon RX 9070 XT Challenger Triple Fan 16GB GDDR6 PCIe 5.0 Graphics Card",
        "price": "$570",
        "note": "In-Store Pick Up Only"
    },
    {
        "name": "1500W Elite Gourmet Countertop Electric Double Cast Iron Burners (6.5\" & 5\")",
        "price": "$16",
        "note": ""
    },
    {
        "name": "Prime Members: 10.1-Oz Red Devil Window & Door Silicon Acrylic Caulk",
        "price": "$3.00",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: Baseus Bass BH1 NC Adaptive Active Noise Cancelling Headphones",
        "price": "$28",
        "note": "+ Free Shipping"
    },
    {
        "name": "4-Pk Hanes Men's Short Sleeve Essentials Crewneck T-Shirts (various)",
        "price": "from $11.60",
        "note": ""
    },
    {
        "name": "adidas Men's Galaxy 7 Running Shoes (Various Colors)",
        "price": "$26",
        "note": "+ Free Shipping"
    },
    {
        "name": "Jamo Speakers: Jamo S 809 (pair) + Jamo S 801 (pair) + Jamo S 83 + Jamo S 810",
        "price": "$399",
        "note": "+ Free Shipping"
    },
    {
        "name": "6-pc Trazon Scrub Brush Set (Black or Red & Blue)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Bitvae C6 Water Dental Flosser Pick (Black)",
        "price": "$8.00",
        "note": ""
    },
    {
        "name": "NDLBS 3D Animal Paw Socks (Dog)",
        "price": "$2.00",
        "note": ""
    },
    {
        "name": "Roland TD-27KV Gen 2 V-Drums Electronic Drum Kit",
        "price": "$2,199",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: LISEN Backseat Tablet Holder for Car Headrest",
        "price": "$10",
        "note": "+ Free Shipping"
    },
    {
        "name": "Shin Megami Tensei V: Vengeance (Nintendo Switch or PS5)",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Mission: Impossible 6 Movie Collection (4K UHD + Blu-ray + Digital)",
        "price": "$35",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds w/ Active Noise Cancellation & USB-C Case",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "13.6\" Apple MacBook Air Laptop (2025): 2560x1664, M4 Chip, 16GB RAM, 256GB SSD",
        "price": "$749",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Rocky Heavyweight Collection 40th Anniversary Edition (Blu-ray)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "Osprey Daylite Expandable 26+6 Travel Pack (Black or Yellow)",
        "price": "$60",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple iPad Air M3 Wi-Fi Tablet (2025, Various Options)",
        "price": "from $450",
        "note": "+ Free Shipping"
    },
    {
        "name": "2-Years Bitdefender Total Security 2026 Software (5-Devices/Digital Download)",
        "price": "$25",
        "note": ""
    },
    {
        "name": "Samsung EPP/EDU: 256GB 12.4\" Galaxy Tab S10+ Wi-Fi Tablet (Platinum Silver)",
        "price": "$525 or Less",
        "note": "+ Free Shipping"
    },
    {
        "name": "LISEN 3-Pack MagSafe iPhone Cases (various): 16 Series & 17 Series",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Sonos Beam Gen 2 Soundbar with Dolby Atmos (Black or White)",
        "price": "$349",
        "note": "+ Free Shipping"
    },
    {
        "name": "HP OmniBook X Flip 2-in-1 Laptop: 16\" 1200p IPS Touch, Ryzen AI 5 340, 16GB RAM",
        "price": "$430",
        "note": "+ Free Shipping"
    },
    {
        "name": "Hanes Men's Ecosmart Pullover Crewneck Fleece Sweatshirt (Stonewashed Green)",
        "price": "$7.95",
        "note": ""
    },
    {
        "name": "1-Year Microsoft 365 Personal (1-Person) + 1-Year NordVPN (10-Devices)",
        "price": "$46",
        "note": "Digital Delivery"
    },
    {
        "name": "Magic The Gathering Dragonstorm Commander Deck: Sultai Arisen",
        "price": "$45",
        "note": "+ Free Shipping"
    },
    {
        "name": "2048Wh 4000W Anker SOLIX C2000 Gen 2 LiFePO Portable Power Station",
        "price": "$699",
        "note": "+ Free Shipping"
    },
    {
        "name": "Certified Refurbished: Sonos Arc Premium Smart Soundbar (Black or White)",
        "price": "$399",
        "note": "+ Free Shipping"
    },
    {
        "name": "Assassin’s Creed Shadows / Limited Edition (PS5)",
        "price": "$35",
        "note": ""
    },
    {
        "name": "Pudolla Men's Quick Dry Stretch Golf Pants w/ 2 Pockets & 1 Rear Pocket (various)",
        "price": "from $16",
        "note": ""
    },
    {
        "name": "85\" Hisense 85QD7N QLED 4K 144Hz Google Smart TV",
        "price": "$648",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Pack 52-Oz Dial Antibacterial Liquid Hand Soap Refill (Spring Water)",
        "price": "$11",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Lenovo ThinkBook 14 Gen 7 Laptop: 14\" WUXGA, Ryzen 5 7533HS, 16GB RAM, 512GB SSD",
        "price": "$479",
        "note": "+ Free Shipping"
    },
    {
        "name": "Crocs Men's & Women's Classic Marbled Sandals (Various)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Refurb Excellent: 49mm Apple Watch Ultra 2 GPS + Cellular Smartwatch (Black)",
        "price": "$495",
        "note": "+ Free Shipping"
    },
    {
        "name": "100-pc Amazon Basics Drill & Driver Multi-Bit Set",
        "price": "$20",
        "note": ""
    },
    {
        "name": "eufy Security SoloCam E42 4-Cam Kit (HomeBase S380)",
        "price": "$460",
        "note": "& More + Free Shipping"
    },
    {
        "name": "4-Pack 24\" WORKPRO Bungee Cords w/ Hooks (3 Colors)",
        "price": "from $7",
        "note": ""
    },
    {
        "name": "Refurbished: Dyson V15 Detect Total Clean Extra Cordless Stick Vacuum",
        "price": "$300",
        "note": "+ Free Shipping"
    },
    {
        "name": "Third Reality Zigbee Motion Sensor",
        "price": "$12",
        "note": ""
    },
    {
        "name": "8-Count BodyRefresh Shower Steamers: Oceanic Breeze $3.80, Purple",
        "price": "$3.30",
        "note": ""
    },
    {
        "name": "Shop Samsung App: 512GB Galaxy S25 Ultra 5G Unlocked Smartphone (Titanium Gray)",
        "price": "$750",
        "note": "+ Free Shipping"
    },
    {
        "name": "LG gram 17\" Laptop: 2560x1600 Touch, Ultra7 258V, 32GB RAM, 1TB SSD",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "Govee RGBIC Dimmable 1000 Lumen Smart Corner LED Floor Lamp",
        "price": "$60",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: 850-ml Godinger Whiskey Decanter Globe Set w/ 2 Whiskey Glasses",
        "price": "$24",
        "note": "+ Free Shipping"
    },
    {
        "name": "Ubiquiti UniFi Dream Router 7 Desktop 10G WiFi 7 Cloud Gateway",
        "price": "$229",
        "note": "+ Free Shipping"
    },
    {
        "name": "Govee Smart Outdoor S14 Bulb String Lights 2: 144-ft $119, 96-ft",
        "price": "$70",
        "note": "+ Free Shipping"
    },
    {
        "name": "512GB Ubiquiti Unifi Cloud Gateway Max",
        "price": "$179",
        "note": "+ Free Shipping"
    },
    {
        "name": "128GB 11\" Apple iPad 11th Gen A16 Chip Wi-Fi Tablet (Early 2025, Various)",
        "price": "$279",
        "note": "+ Free Shipping"
    },
    {
        "name": "Insta360 X4 360° 8K Action Camera",
        "price": "$300",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: Victorinox Evolution EvoGrip 14 Swiss Army Knife (Red/Black)",
        "price": "$32",
        "note": "+ Free Shipping"
    },
    {
        "name": "DoorDash DashPass Members: Any NBA Player Scoring 50+ Point During Game & Get",
        "price": "50% Off Delivery Orders",
        "note": "(Up to $10 Off; Valid 9AM-Midnight PT)"
    },
    {
        "name": "5000A HPBS Portable Jump Starter w/ LED Flashlight (Up to 10L Gas / 8L Diesel)",
        "price": "$25",
        "note": "+ Free Shipping"
    },
    {
        "name": "Dickies Boy's Flannel Shirt Jacket (Red)",
        "price": "from $8.15",
        "note": ""
    },
    {
        "name": "GoveeLife Smart Water Leak Detector 1s + WiFi Gateway Alarm: 5-pk $45, 3-pk",
        "price": "$31",
        "note": "& More"
    },
    {
        "name": "12-Pack 20-Oz BODYARMOR Flash I.V. Zero Sugar Electrolyte Beverage (Lemon Lime)",
        "price": "$12",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "35-Count Arm & Hammer Power Sheets Laundry Detergent (Fresh Breeze)",
        "price": "$5.00",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Prime Members: ScotchBlue Painter's Tape Applicator",
        "price": "$2.80",
        "note": "+ Free Shipping"
    },
    {
        "name": "Used / Like New: PlayStation DualSense Wireless Controller (Cosmic Red)",
        "price": "$38",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: Govee Outdoor Smart Net Lights: 2.8' x 9.4' $90, 2.8' x 4.7'",
        "price": "$50",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Matagot Chu Han Strategy Deck Card Game: A Game of Dynastic Intrigue",
        "price": "$8.00",
        "note": ""
    },
    {
        "name": "16-Oz Dawn Platinum Plus Powerwash Dish Spray (Lemon)",
        "price": "$2.75",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "LEGO Speed Champions Mercedes-AMG G 63 & Mercedes-AMG SL 63 F1 Building Kits (76924)",
        "price": "$26",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "24-Count Energizer Ultimate Lithium AA Batteries",
        "price": "$35",
        "note": "+ Free Shipping"
    },
    {
        "name": "DEWALT TSTAK IV 7\" Stackable Double Drawer Small Parts Organizer",
        "price": "$27",
        "note": ""
    },
    {
        "name": "High Sierra Loop Backpack w/ Tablet Sleeve (Midnight Blue/Black/Lime)",
        "price": "$17",
        "note": ""
    },
    {
        "name": "Costco Members: Apple AirPods 4 Wireless Earbuds w/ Active Noise Cancellation",
        "price": "$100",
        "note": "+ Free S/H"
    },
    {
        "name": "25.4-Oz Lotus Biscoff Creamy Cookie Butter Spread",
        "price": "$5.05",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Sony PlayStation DualSense Wireless Controller (Ghost of Yōte Limited Edition)",
        "price": "$65",
        "note": "+ Free S/H"
    },
    {
        "name": "Costco Members: Astro Bot (PS5)",
        "price": "$33",
        "note": "+ Free S/H"
    },
    {
        "name": "Moen Spot Resist Remote Dock for Magnetix Handheld Shower Head (Brushed Nickel)",
        "price": "$9.00",
        "note": ""
    },
    {
        "name": "Lee Men's Legendary Slim Straight Jeans (Cardwell)",
        "price": "$14",
        "note": ""
    },
    {
        "name": "8.5-Oz Planters Deluxe Whole Cashews (Lightly Salted)",
        "price": "$3.30",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "9.4-Oz Velveeta Shells & Cheese (Broccoli)",
        "price": "$1.10",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "6-Pack Hanes Men's Max Cushioned Crew Socks (Black/Grey)",
        "price": "$6.50",
        "note": ""
    },
    {
        "name": "PlayStation Black Friday Deals: God of War Ragnarok (PS5) $20, Spider-Man 2 (PS5)",
        "price": "$30",
        "note": "& More + Free Store Pickup"
    },
    {
        "name": "Sony PlayStation DualSense Wireless Controller (God of War: Limited Edition)",
        "price": "$64",
        "note": "+ Free S/H"
    },
    {
        "name": "Sony PlayStation VR2 Horizon Call of the Mountain Bundle (PS VR2)",
        "price": "$299",
        "note": "+ Free S/H"
    },
    {
        "name": "PlayStation 5 Game Sale: Astro Bot $40, Horizon Forbidden West",
        "price": "$20",
        "note": "& More"
    },
    {
        "name": "Select Sam's Club Location: 660-Piece LEGO Botanicals Hibiscus Flower Set",
        "price": "$45",
        "note": "+ Free S/H on $50+ w/ Sam's Plus Membership"
    },
    {
        "name": "2-Pack Hanes Men's Cool DRI Long Sleeve T-Shirts (Deep Red)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "70\" Insignia Class F50 Series LED 4K UHD Smart Fire TV (2025 Model)",
        "price": "$300",
        "note": "+ Free Shipping"
    },
    {
        "name": "Sony PlayStation Wireless Controller (Various): DualSense Edge $169, DualSense",
        "price": "from $54",
        "note": "+ Free Shipping"
    },
    {
        "name": "32GB Amazon Kindle 7\" Paperwhite Signature Edition WiFi Tablet (various colors)",
        "price": "$150",
        "note": "+ Free S/H"
    },
    {
        "name": "Men's Columbia Cascadian Peaks Insulated Jacket (various colors/sizes)",
        "price": "$60",
        "note": "+ Free S/H"
    },
    {
        "name": "Razer BlackShark V2 HyperSpeed Wireless Gaming Headset (Xbox, PS5, PC, Switch 2)",
        "price": "$60",
        "note": "+ Free Shipping"
    },
    {
        "name": "Twin Peaks: From Z to A (Blu-Ray)",
        "price": "$43",
        "note": "+ Free S/H"
    },
    {
        "name": "1-Year ESET Home Security Essential (3 Devices, Digital Download)",
        "price": "$13",
        "note": "& More"
    },
    {
        "name": "eufy Security E340 2K Video Doorbell w/ Dual Cameras & Extra Battery",
        "price": "$130",
        "note": "& More + Free S&H"
    },
    {
        "name": "Anker Nano 2-Port 47W Compact Foldable USB-C GaN Charger (various colors)",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Funko Pop! Animation: Inuyasha Anime Figure (Laying Down)",
        "price": "$6.00",
        "note": ""
    },
    {
        "name": "Anker Prime Charger 200W 6-Port GaN Charging Station",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Kreg Cabinet Door Mounting Jig",
        "price": "$13",
        "note": ""
    },
    {
        "name": "Xbox One/Series X|S Digital Games: WWE 2K25 $21, GTA: The Trilogy: Definitive",
        "price": "$18",
        "note": "& More"
    },
    {
        "name": "Costco Members: 1TB Sony PS5 Slim Disc Console w/ Sony DualSense Controller",
        "price": "$480",
        "note": "+ Free S/H"
    },
    {
        "name": "200-Count 8.62\" Amazon Basics Everyday Paper Plates",
        "price": "$8.05",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "8Bitdo Ultimate 2 Wireless Controller w/ TMR Joysticks & Charging Dock",
        "price": "$48",
        "note": "+ Free Shipping"
    },
    {
        "name": "Silent Hill f (PS5 or Xbox Series X)",
        "price": "$50",
        "note": "+ Free S/H"
    },
    {
        "name": "Kingdom Come: Deliverance II (PS5 or Xbox Series X)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "Armored Core VI: Fires of Rubicon (various platforms)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "2-Year Bitdefender Family Pack 2026 Software (15 Devices / Digital Download)",
        "price": "$35",
        "note": "& More"
    },
    {
        "name": "Sonic Frontiers (Xbox Series X)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Sony PS5 DualSense Wireless Controllers: Metallic/Chroma $60, Standard",
        "price": "$55",
        "note": "& More + Free S&H"
    },
    {
        "name": "55\" TCL S5-Series 4K UHD HDR LED Smart Google TV",
        "price": "$170",
        "note": "+ Free Shipping"
    },
    {
        "name": "PS5 Console Sale: Pro $650, Slim Digital $400, Ghost of Yōtei Gold Edition",
        "price": "$500",
        "note": "& More + Free S&H"
    },
    {
        "name": "Govee Table Lamp 2 Pro x Sound by JBL Smart Cordless Lamp w/ Speaker",
        "price": "$135",
        "note": "+ Free Shipping"
    },
    {
        "name": "Baseus Eli 2i Fit Open-Ear Earbud Headphones (Black or White)",
        "price": "$9.95",
        "note": ""
    },
    {
        "name": "Govee Christmas Sparkle String Lights: 66' 250 LED $70, 99' 375 LED",
        "price": "$85",
        "note": "+ Free Shipping"
    },
    {
        "name": "ASUS ZenBook A14 Laptop: 14\" FHD+ OLED, Snapdragon X Plus, 16GB RAM, 512GB SSD",
        "price": "$550",
        "note": "+ Free Shipping"
    },
    {
        "name": "PlayStation Game Sale: Horizon Zero Dawn Remastered or The Nioh Collection (PS5)",
        "price": "$20 Each",
        "note": "& More + Free S&H"
    },
    {
        "name": "Arc'teryx Heliad Belt 32 Mesh 32mm Belt w/ Low-Profile Buckle (Black)",
        "price": "$14",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirPods 4 Wireless Earbud Headphones w/ USB-C Charging Case",
        "price": "$80",
        "note": "+ Free Shipping"
    },
    {
        "name": "65\" TCL QM8K Series QD-Mini LED 4K 144Hz Google Smart TV (2025 Model)",
        "price": "$898",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: LISEN MagSafe Hands Free Travel Phone Holder for iPhone (Black)",
        "price": "$9.90",
        "note": "+ Free Shipping"
    },
    {
        "name": "Seagate Expansion Desktop External Hard Drive: 28TB $280, 24TB",
        "price": "$240",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: CUKTECH 20000mAh 45W Power Bank w/ Built-in USB-C Cable",
        "price": "$17",
        "note": "+ Free Shipping"
    },
    {
        "name": "Weber Smokey Joe 14\" Portable Grill (Mocha)",
        "price": "$25",
        "note": ""
    },
    {
        "name": "96-Count Fresh Roasted Coffee Dark Roast Blend K-Cup Pods (variety pack)",
        "price": "$21",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "128GB Lenovo Idea Tab Plus Tablet: 12.1\" 1600p, MediaTek 6400, 8GB RAM, Android 15",
        "price": "$180",
        "note": "+ Free Shipping"
    },
    {
        "name": "Godzilla (4K Ultra HD + Blu-ray + Digital)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "2-Piece Govee RGBICWW Wi-Fi + Bluetooth Flow Plus Light Bars",
        "price": "$30",
        "note": ""
    },
    {
        "name": "Teenage Mutant Ninja Turtles: Mutant Mayhem Steelbook (4K UHD + Blu-ray + Digital)",
        "price": "$18",
        "note": ""
    },
    {
        "name": "2-Piece GEARWRENCH 1/4\" & 3/8\" 120XP Dual Material Flex Handle Teardrop Ratchet Set",
        "price": "$52",
        "note": "+ Free Shipping"
    },
    {
        "name": "16-Pack 4.23oz Nongshim Shin Original Ramyun Noodle Soup (Gourmet Spicy)",
        "price": "$12",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "5-Pack 6' Anker 100W USB-C to USB-C Type C Charging Cable (Black)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "Talk to Me (4K Ultra HD + Blu-ray + Digital)",
        "price": "$9.25",
        "note": ""
    },
    {
        "name": "Sonic Origins Plus (Xbox Series X / Xbox One)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Transformers G1 Autobot Hot Rod Collectible",
        "price": "$15",
        "note": ""
    },
    {
        "name": "6-Count Scotch Heavy Duty Packaging Tape (Clear; 1.88\" x 22.2yd)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "16-Oz Craftsman Fiberglass Hammer",
        "price": "$6.00",
        "note": ""
    },
    {
        "name": "Apple AirPods Pro 3 Wireless Active Noise Cancelling Earbuds",
        "price": "$220",
        "note": "+ Free Shipping"
    },
    {
        "name": "200' Govee Permanent Outdoor IP67 Lights Pro w/ 120 RGBIC LED Lights",
        "price": "$460",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirPods Pro 2 Wireless Earbuds",
        "price": "$139",
        "note": "+ Free Shipping"
    },
    {
        "name": "EDU/EPP: 15.6\" Samsung Galaxy Book4 Edge Laptop: Snapdragon X, 16GB RAM, 512GB",
        "price": "$375",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirTag (MX532LL/A)",
        "price": "$18",
        "note": "+ Free Shipping"
    },
    {
        "name": "Anker Nano 30W USB C Wall Charger + 6' USB C to C Cable",
        "price": "$10",
        "note": ""
    },
    {
        "name": "64-Oz Ocean Spray Cran-Grape Cranberry Grape Juice Drink",
        "price": "$1.20",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "50-Oz Amazon Basics Liquid Hand Soap Refill (various)",
        "price": "from $2.75",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "150-Count Amazon Basics Wood-Cased #2 Pencils (Yellow)",
        "price": "$8.55",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "20\" Husqvarna 450 Rancher 50.2-cc 2-Cycle X-Torq Gas Chainsaw",
        "price": "$352",
        "note": "+ Free Shipping"
    },
    {
        "name": "14-Piece Rubbermaid Brilliance Plastic Food Storage Containers w/ Lids",
        "price": "$24",
        "note": ""
    },
    {
        "name": "Lacoste Men's Original Cotton Pique Polo Shirt (Various Colors)",
        "price": "from $35.20",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Pack Calvin Klein Cotton Stretch V Neck Tee (Black, Large)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "3.71oz medicube Collagen Niacinamide Jelly Cream",
        "price": "$11",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "100-Piece PicassoTiles Magnetic Marble Run Building Set",
        "price": "$29",
        "note": ""
    },
    {
        "name": "H-E-B: Buy $100+ Select Retailer Gift Cards (Home Depot, Lowe's, Best Buy, etc.),",
        "price": "Get $20 H-E-B Gift Card for Free",
        "note": "& More (In-Store Only)"
    },
    {
        "name": "26\" 5TH WHEEL AB17 500W Electric Bike, up to 23mph / 45 miles",
        "price": "$214",
        "note": "+ Free Shipping"
    },
    {
        "name": "4-Pack Sunlu 1KG 1.75mm Quadruple Color Silk Filament",
        "price": "$48",
        "note": "+ Free Shipping"
    },
    {
        "name": "Amazon Essentials Men's Full-Zip Fleece Hoodie (Various)",
        "price": "$9.95",
        "note": ""
    },
    {
        "name": "ORICO M.2 NVMe SSD Enclosure",
        "price": "$10",
        "note": ""
    },
    {
        "name": "512GB Samsung P9 microSD Express Memory Card (Nintendo Switch 2 Compatible)",
        "price": "$75",
        "note": "+ Free Shipping"
    },
    {
        "name": "adidas Men's Lite Racer Adapt 7.0 Shoes (Various)",
        "price": "$23",
        "note": "+ Free Shipping"
    },
    {
        "name": "Prime Members: LISEN Foldable Tablet Stand Holder (up to 15.9\", Black)",
        "price": "$8.65",
        "note": "+ Free Shipping"
    },
    {
        "name": "5-Pack 6' Anker 60W USB-C to USB-C Charging Cable (Black)",
        "price": "$12",
        "note": ""
    },
    {
        "name": "Sony PS-LX310BT Belt Drive Turntable Bluetooth Vinyl Record Player w/ USB Output",
        "price": "$198",
        "note": "+ Free Shipping"
    },
    {
        "name": "HP Laptop: 15.6\" FHD IPS Touch, Intel i7-1355U, 16GB RAM, 512GB SSD",
        "price": "$500",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Pack 8\" Scotch Brand Precision Ultra Edge Non-Stick Scissors",
        "price": "$8.35",
        "note": ""
    },
    {
        "name": "Resident Evil 7 biohazard Gold Edition (PlayStation 5)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Columbia Women's Newton Ridge Plus Waterproof Hiking Boots (Size 10.5 Only)",
        "price": "$24",
        "note": ""
    },
    {
        "name": "Star Wars Outlaws Limited Edition (PS5 or Xbox Series X)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "224-Piece LEGO Santa's Delivery Truck Building Toy Set",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Fractal Design Computer Cases: Meshify 3 XL Full $111, Focus 2 RGB Mid",
        "price": "$65",
        "note": "& More + Free Shipping"
    },
    {
        "name": "82.5-Oz Purex 4-in-1 Ultra Concentrated Liquid Laundry Detergent (Mountain Breeze)",
        "price": "$8.70",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Milwaukee M12 12V Cordless 1/4\" Hex Screwdriver Kit w/ 1.5Ah Battery & Charger",
        "price": "$59",
        "note": "+ Free Shipping"
    },
    {
        "name": "Columbia Sportswear: Select Styles on Men's, Women's, & Kids' Apparel & Shoes",
        "price": "50% Off",
        "note": "+ Free Shipping"
    },
    {
        "name": "3-Pack Calvin Klein Men's Cotton Stretch Boxer Brief (Medium, Black)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Stanley The IceFlow Tumbler w/ Fast Flow Lid (various)",
        "price": "from $12",
        "note": "& More"
    },
    {
        "name": "4-Pack Apple AirTags Bluetooth Tracking Device",
        "price": "$65",
        "note": "+ Free Shipping"
    },
    {
        "name": "Vortex SPARC AR 2 MOA Red Dot Sight",
        "price": "$70",
        "note": "+ $10.70 Shipping"
    },
    {
        "name": "WORX 4V Lithium Screwdriver w/ 30-Piece Accessory Kit",
        "price": "$30",
        "note": ""
    },
    {
        "name": "1024Wh 2000W Anker SOLIX C1000 Gen 2 LiFePO Portable Power Station",
        "price": "$349",
        "note": "+ Free Shipping"
    },
    {
        "name": "Grave of the Fireflies Limited Edition Steelbook (Blu-ray + DVD)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Blade Runner: Final Cut (4K UHD + Blu-ray)",
        "price": "$13",
        "note": ""
    },
    {
        "name": "Capcom Fighting Collection 2 (Nintendo Switch or PS4)",
        "price": "$25",
        "note": ""
    },
    {
        "name": "New/Select Returning Members: 3-Months Audible Premium Plus + $20 Credit",
        "price": "$1/month",
        "note": ""
    },
    {
        "name": "Walmart+ Members: Sign-Up for 60-Day eMeals Free Trial Offer, Get",
        "price": "$10 in Walmart Cash",
        "note": ""
    },
    {
        "name": "2-Pack HW 9V NiMH 200mAh Rechargeable Batteries",
        "price": "$4.50",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Fruit of the Loom Mens Short Sleeve V-neck Top & Short Pajama Set (XL only)",
        "price": "from $6",
        "note": ""
    },
    {
        "name": "Mission Cooling Boonie Hat (Various Colors)",
        "price": "$8.60",
        "note": "+ Free S&H w/ Amazon Prime"
    },
    {
        "name": "Samsung Galaxy Watch 7 Bluetooth AI Smartwatch (various colors): 44mm $160, 40mm",
        "price": "$130",
        "note": "& More + Free Shipping"
    },
    {
        "name": "(Used, Like New) 1-Meter Apple Watch Magnetic Fast Charger to USB-C Cable",
        "price": "$10",
        "note": ""
    },
    {
        "name": "34\" Alienware AW3423DWF 3440x1440 165Hz Curved QD-OLED Gaming Monitor",
        "price": "$500",
        "note": "+ Free Shipping"
    },
    {
        "name": "Amazon Warehouse/Resale Prime Day Deals: Select Used Items (Various Conditions)",
        "price": "Up to 30% Off",
        "note": "(Stock May Vary)"
    },
    {
        "name": "Coway AP-1512HH Mighty Air Purifier w/ HEPA & Eco Mode (Black or White)",
        "price": "$143",
        "note": "+ Free Shipping"
    },
    {
        "name": "Anker 2-in-1 USB-C to 2x USB-C 140W Max Fast Charging Cable: 6-ft $17, 4-ft",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Select Stores: Open Box: Apple AirPods 4 Wireless Earbuds w/ USB-C Charging Case",
        "price": "from $58",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "1-year Adobe Lightroom Photo Editor w/ 1TB Cloud Storage (Digital Download)",
        "price": "$60",
        "note": "& More"
    },
    {
        "name": "98\" TCL Class Q55K Series 4K UHD HDR QLED Smart Google TV (2025)",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "Open Box: 8\" Legion Go S Handheld Gaming System: Z1 Extreme, 32GB RAM, 1TB SSD",
        "price": "from $493",
        "note": "(Select Stores) + Free Store Pickup"
    },
    {
        "name": "3-Pack Trazon 1\" x 120' Double Sided Woodworking Tape",
        "price": "$7.00",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "1151-pc LEGO Icons Blacktron Renegade Building Kit (10355)",
        "price": "$64",
        "note": "+ Free Shipping"
    },
    {
        "name": "No Man's Sky (Nintendo Switch)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "6-Pack 32.8' Govee Outdoor Deck Lights",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "6\" IGAN-P6 Side Cutter Clippers w/ Longer Flush Cutting Edge: 5-Pack $19, 1-Pack",
        "price": "$5.00",
        "note": ""
    },
    {
        "name": "Vitamix 5200 Professional-Grade Blender w/ 64-Oz Container (Various)",
        "price": "$300",
        "note": "+ Free Shipping"
    },
    {
        "name": "Harman Kardon Aura Studio 4 Bluetooth Speaker",
        "price": "$150",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple Watch Series 11 GPS Smartwatch w/ Aluminum Case: 46mm $380, 42mm",
        "price": "$350",
        "note": "+ Free Shipping"
    },
    {
        "name": "GL.iNet GL-MT3000 Beryl AX Pocket-Sized Wi-Fi 6 Wireless Travel Gigabit Router",
        "price": "$70",
        "note": "+ Free Shipping"
    },
    {
        "name": "Select Accounts: 12-Oz Lavazza Coffee (Dolcevita Classico, Whole Bean or Ground)",
        "price": "$4.45",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "42mm Apple Watch Series 10 GPS + Cellular w/ Aluminum Case (2 Options)",
        "price": "$249",
        "note": "+ Free Shipping"
    },
    {
        "name": "Sonos One SL Wireless Speaker (Certified Renewed, Shadow Black)",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "98\" TCL QM7K Series 4K HDR QD-Mini LED Smart Google TV (2025 Model)",
        "price": "$2,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "5-Film The Bourne Complete Collection (Blu-ray + Digital HD)",
        "price": "$14",
        "note": ""
    },
    {
        "name": "4-Pack Apple AirTags Bluetooth Tracking Device",
        "price": "$65",
        "note": "+ Free Shipping"
    },
    {
        "name": "Beats Studio Pro Wireless Noise Cancelling Headphones (Matte White)",
        "price": "$140",
        "note": "& More + Free Shipping"
    },
    {
        "name": "The Penguin: The Complete First Season (Blu-ray)",
        "price": "$17",
        "note": ""
    },
    {
        "name": "Anker Nano 45W Type C Charger w/ 6' USB-C to USB-C Cable",
        "price": "$18",
        "note": ""
    },
    {
        "name": "DJI Mic Mini Wireless Lavalier Microphone w/ 2x TX + 1x RX + Charging Case",
        "price": "$80",
        "note": "+ Free Shipping"
    },
    {
        "name": "Flashforge AD5X Multi-Color 3D Printer w/ Auto Leveling Control",
        "price": "$239",
        "note": "+ Free S/H"
    },
    {
        "name": "108-Piece DeWALT Mechanics Tools Kit & Socket Set",
        "price": "$61",
        "note": "+ Free Shipping"
    },
    {
        "name": "Mechanix Wear Utility Gloves (Black/Grey)",
        "price": "$10",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "New Starz Subscribers: 12-Month Starz Streaming Service Plan",
        "price": "$12",
        "note": ""
    },
    {
        "name": "ZRENJHUS 3D Crystal Glass Ball w/ USB Powered LED Wooden Lamp Holder (Various)",
        "price": "from $5",
        "note": "& More"
    },
    {
        "name": "Sony ULT WEAR Wireless Noise Canceling Headphones (various)",
        "price": "$148",
        "note": "+ Free Shipping"
    },
    {
        "name": "Used Like New: UNIDEN R8 GPS Extreme Long-Range Radar/Laser Detector",
        "price": "$485",
        "note": "+ Free Shipping"
    },
    {
        "name": "be quiet! Pure Power 13 M 1000W 80+ Gold ATX 3.1 Fully Modular PSU",
        "price": "$112",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple Watch Ultra 2 49mm GPS + Cellular Smartwatch (various)",
        "price": "$599",
        "note": "+ Free Shipping"
    },
    {
        "name": "17\" Cuisinart Tabletop Gas Griddle Outdoor Flat-Top Grill w/ Grease Cup",
        "price": "$56",
        "note": "+ Free Shipping"
    },
    {
        "name": "6-Pairs Nike Everyday Cushioned Training Socks (Crew, White)",
        "price": "$14",
        "note": ""
    },
    {
        "name": "NBA 2K26 (PlayStation 5, Xbox Series X, Nintendo Switch 2 or Nintendo Switch)",
        "price": "$30",
        "note": "+ Free Shipping"
    },
    {
        "name": "48\" Fitvids Standard Threaded Curl Barbell Curl Bar w/ Collars",
        "price": "$13",
        "note": ""
    },
    {
        "name": "Shadow Labyrinth: Secret Edition (Nintendo Switch)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "TCL S45H S Class 2.0 Channel Sound Bar w/ Dolby Atmos, DTS Virtual:X & Bluetooth",
        "price": "$65",
        "note": "+ Free Shipping"
    },
    {
        "name": "OLIGHT IMINI 2 EDC 50 Lumens Rechargeable Keychain Flashlight (5 Colors)",
        "price": "$12",
        "note": ""
    },
    {
        "name": "Sennheiser HD 599 SE Around Ear Open Back Headphone (black)",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "20TB WD Elements USB 3.0 Desktop External Hard Drive",
        "price": "$270",
        "note": "+ Free Shipping"
    },
    {
        "name": "Gerber Paraframe Mini Folding Knife (Stainless Steel)",
        "price": "$9.95",
        "note": ""
    },
    {
        "name": "ASUS Dual Radeon RX 9060 XT 16GB GDDR6 PCIe 5.0 Graphics Card",
        "price": "$340",
        "note": "+ Free Shipping"
    },
    {
        "name": "2-pk Ring Alarm Contact Sensor (2nd Gen)",
        "price": "$16",
        "note": ""
    },
    {
        "name": "Amazon Essentials Men's/Big/Tall Regular Fit Long Sleeve Dress Shirt (Various)",
        "price": "$9.95",
        "note": ""
    },
    {
        "name": "Xfinity Rewards Members: $10 Voucher for Select Books at Amazon",
        "price": "Free",
        "note": ""
    },
    {
        "name": "128GB 11\" Apple iPad 11th Gen A16 Chip Wi-Fi Tablet (3 Colors)",
        "price": "$280",
        "note": "& More + Free Shipping"
    },
    {
        "name": "MIHOVER 450W Electric Scooter w/ Seat (up to 21 Miles / 15.5MPH, Black)",
        "price": "$245",
        "note": "+ Free Shipping"
    },
    {
        "name": "12-Month Adobe Creative Cloud Photography Plan w/ 1TB Cloud (Digital Download)",
        "price": "$85",
        "note": "& More"
    },
    {
        "name": "43\" Toshiba 43C350NU 3840x2160 4K UHD 60Hz Smart LED Fire TV",
        "price": "$130",
        "note": "+ Free Shipping"
    },
    {
        "name": "98″ Hisense QD5 QLED 4K UHD Smart Google TV (98QD5QG, 2025 Model)",
        "price": "$1,000",
        "note": "+ Free Shipping"
    },
    {
        "name": "Fisher-Price Laugh & Learn Mix & Learn DJ Table Toy + $8.50 Walmart Cash",
        "price": "$35",
        "note": "+ Free Shipping"
    },
    {
        "name": "The Mummy Trilogy (4K Ultra HD + Blu-ray + Digital)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds w/ USB-C Charging Case",
        "price": "$80",
        "note": "+ Free Shipping"
    },
    {
        "name": "8\" Legion Go S Handheld Gaming System: Z1 Extreme, 32GB, 1TB",
        "price": "$650",
        "note": "+ Free Shipping"
    },
    {
        "name": "Shaun of the Dead / Hot Fuzz / The World's End (4K Ultra HD + Blu-ray + Digital 4K)",
        "price": "$19",
        "note": ""
    },
    {
        "name": "Existing AliExpress Customers: Powkiddy RGB20S Retro Gaming Handheld (Black)",
        "price": "$27",
        "note": "+ Free Shipping"
    },
    {
        "name": "85\" TCL Class Q5K Series 4K UHD QLED LED Smart Google TV (2025)",
        "price": "$700",
        "note": "+ Free Shipping"
    },
    {
        "name": "950-Piece LEGO Icons: Transformers Bumblebee 1980s Robot Figure Building Set",
        "price": "$63",
        "note": "+ Free S/H"
    },
    {
        "name": "EPP/EDU Members: 75\" Samsung Neo QLED QN1EF 4K TV + 43\" Crystal UHD U8000F 4K TV",
        "price": "$855",
        "note": "+ Free Shipping"
    },
    {
        "name": "87-Oz Konokyo Insulated Stainless Steel Water Bottle w/ 3x Lids, Paracord & Pouch",
        "price": "$19",
        "note": ""
    },
    {
        "name": "ECO-WORTHY 100W Portable Foldable Solar Panel w/ Adjustable Stand",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Google Pixel Buds Pro 2 (Moonstone)",
        "price": "$134",
        "note": "+ Free Shipping"
    },
    {
        "name": "Anker Zolo 10,000mAh 30W USB-C Fast Charging Power Bank",
        "price": "$15",
        "note": "+ Free Shipping"
    },
    {
        "name": "Costco Members: Bose QuietComfort SE Noise Cancelling Over-the-Ear Headphones",
        "price": "$170",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds with Active Noise Cancellation",
        "price": "$110",
        "note": "+ Free Shipping"
    },
    {
        "name": "VIOFO Dash Cam: A229 Plus Dual STARVIS 2 Sensors & Voice Control",
        "price": "$160",
        "note": "& More + Free Shipping"
    },
    {
        "name": "The North Face Men's Evolution Crew Sweatshirt (Grey Heather)",
        "price": "$22",
        "note": "+ Free Shipping"
    },
    {
        "name": "Vornado TAVH10 1500-Watts Space Heater w/ Remote",
        "price": "$84",
        "note": "+ Free Shipping"
    },
    {
        "name": "CORSAIR 2500X Micro ATX Dual Chamber Tempered Glass PC Case (White; Small Tower)",
        "price": "$50",
        "note": "+ Free Shipping"
    },
    {
        "name": "Western Digital Elements USB 3.0 External Hard Drive: 20TB $270, 14TB",
        "price": "$170",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds w/ USB-C Charging Case",
        "price": "$80",
        "note": "+ Free Shipping"
    },
    {
        "name": "Hanes Men's Full-Zip Eco-Smart Hoodie (Various Colors)",
        "price": "from $9.50",
        "note": ""
    },
    {
        "name": "Prime Channel Subscriptions Sale: 2-Month BritBox $2.75/Month, 6-Month AppleTV+",
        "price": "$6/Month",
        "note": "& More"
    },
    {
        "name": "Amazon Essentials Women's Ponte Leggings (Various Colors)",
        "price": "from $7",
        "note": ""
    },
    {
        "name": "Jackery Explorer 1000 v2 1070Wh 1500W LiFePO4 Portable Power Station",
        "price": "$332",
        "note": "+ Free Shipping"
    },
    {
        "name": "4-Count 2.7-Oz Degree Men's Antiperspirant Deodorant (Adventure)",
        "price": "$8.60",
        "note": "w/ Subscribe & Save"
    },
    {
        "name": "Insignia 4.1 Cu. Ft. Top Load Washer Machine w/ ColdMotion Technology (White)",
        "price": "$400",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "Oura Ring 4 Smart Ring (Silver or Black)",
        "price": "$249",
        "note": "+ Free Shipping"
    },
    {
        "name": "Marvel vs. Capcom Fighting Collection: Arcade Classics (Nintendo Switch)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "8\" Zwilling Twin L Stainless Steel Multi-Purpose Kitchen Shears",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Carhartt Men's Rain Defender Loose Fit Midweight 1889 Graphic Sweatshirt",
        "price": "$40",
        "note": "+ Free Shipping"
    },
    {
        "name": "Like a Dragon: Infinite Wealth (PlayStation 5)",
        "price": "$15",
        "note": ""
    },
    {
        "name": "Apple AirPods Pro 3 Wireless Active Noise Cancelling Earbuds",
        "price": "$220",
        "note": "+ Free Shipping"
    },
    {
        "name": "Escape from L.A. (4K Ultra HD + Blue-Ray) $8, GoodFellas (4K Ultra HD + Blu-ray)",
        "price": "$9.00",
        "note": "& More"
    },
    {
        "name": "Physical Gift Cards: $50 Subway, White Castle Gift Card",
        "price": "$40",
        "note": "& More"
    },
    {
        "name": "Wanlipo A13 4K + 1080p Dual Channel WiFi IPS Dash Cam w/ 64GB microSD Card",
        "price": "$28",
        "note": ""
    },
    {
        "name": "Set of 2 Mainstays Modern Indoor Rubberwood Folding Tray Table (Black Finish)",
        "price": "$18",
        "note": "& More"
    },
    {
        "name": "Apple AirPods 4 Wireless Earbuds with Active Noise Cancellation",
        "price": "$110",
        "note": "+ Free Shipping"
    },
    {
        "name": "Costco Members: 5-Count PUMA Men's Boxer Briefs: 5 Packs for $50 or",
        "price": "1 Pack for $14",
        "note": "& More + Free Shipping"
    },
    {
        "name": "65\" TCL QM8K 4K UHD 144Hz QD-Mini LED Google Smart TV",
        "price": "$900",
        "note": "+ Free Shipping"
    },
    {
        "name": "Elden Ring (PlayStation 5 or Xbox Series X)",
        "price": "$20",
        "note": ""
    },
    {
        "name": "26\" AMYET EB26 1500W Peak 48V 15AH Adult Electric Fat Tire Bike",
        "price": "$321",
        "note": "+ Free Shipping"
    },
    {
        "name": "Sofirn Q8 Plus 16000lm USB C Rechargeable XHP50B Flashlight (6000K-6500K)",
        "price": "$45",
        "note": "+ Free Shipping"
    },
    {
        "name": "Hallmark+ Black Friday Streaming Subscription Offer: Annual $40 or 3-Months",
        "price": "$1/Month",
        "note": "(Valid thru 12/1)"
    },
    {
        "name": "55\" TCL F35-Series 4K UHD HDR LED Smart Fire TV (2025)",
        "price": "$170",
        "note": "+ Free Shipping"
    },
    {
        "name": "Targus 15.6\" Octave III Laptop/Backpack (various colors)",
        "price": "$10",
        "note": "+ Free S/H"
    },
    {
        "name": "24-Liter Osprey Axis Laptop Backpack (Various)",
        "price": "$45",
        "note": "+ Free Shipping"
    },
    {
        "name": "Dyson V12 Detect Slim Vacuum Cleaner (Nickel) + Dyson Furniture Cleaning Kit",
        "price": "$360",
        "note": "w/ Text Signup + Free Shipping"
    },
    {
        "name": "Sennheiser MOMEMTUM 4 Wireless Adaptive NC Over-The-Ear Headphones (Denim)",
        "price": "$180",
        "note": "+ Free Shipping"
    },
    {
        "name": "Amazon Warehouse/Resale Black Friday Offer: Select Used Items (various condition)",
        "price": "Up to 30% Off",
        "note": "(Stock May Vary)"
    },
    {
        "name": "Dead Space (2023): Digital Deluxe Edition (EPIC Games PC Digital Download)",
        "price": "$11",
        "note": ""
    },
    {
        "name": "MSI Force GC30V2 Wireless Gaming Controller (Black or White)",
        "price": "$15",
        "note": "+ Free S/H"
    },
    {
        "name": "3-Piece Crescent Pry Bar Set (5\", 7\" & 10\")",
        "price": "$10",
        "note": "+ Free Shipping"
    },
    {
        "name": "Corsair 2500X RGB Micro ATX Dual Chamber PC Case w/ Tempered Glass (Black)",
        "price": "$50",
        "note": "+ Free S/H"
    },
    {
        "name": "Digital Movie Bundles: It's a Wonderful Life/White Christmas, Bumblebee/Transformers",
        "price": "from $8 each",
        "note": "& More"
    },
    {
        "name": "24TB Seagate BarraCuda 3.5\" 7200 RPM Internal SATA Bare Hard Drive",
        "price": "$240",
        "note": "+ Free S/H"
    },
    {
        "name": "Monopoly Pokemon Edition Family Board Game",
        "price": "$16",
        "note": ""
    },
    {
        "name": "7' Astella Pre-Lit Douglas Fir Christmas Tree w/ Adjustable Branches/Metal Base",
        "price": "$65",
        "note": "+ Free S/H"
    },
    {
        "name": "20oz. Contigo Superior Insulated Travel Mug w/ Snapseal Lid/Handle (Sake)",
        "price": "$12",
        "note": ""
    },
    {
        "name": "BioShock Infinite (PC/Steam Digital Download)",
        "price": "$3.00",
        "note": ""
    },
    {
        "name": "DoorDash Gift Cards (Email Delivery or Physical Card): 15% Off: $100 for",
        "price": "$85",
        "note": "& More"
    },
    {
        "name": "New Visible Members w/ Port-in: Visible+ Pro Annual Phone Plan",
        "price": "$225/yr",
        "note": "(BYOD Port-in Req'd)"
    },
    {
        "name": "$100 Apple eGift Card (Digital Delivery) + $15 Best Buy Promotional eGift Card",
        "price": "$100",
        "note": ""
    },
    {
        "name": "10' LISEN 100W Silicone USB C to USB C Fast Charging Cable (Grey)",
        "price": "$6.00",
        "note": ""
    },
    {
        "name": "7-Pc Tripcomp Hardside Luggage Set w/ 16\"/20\"/24\"/28\" Suitcases, Duffle & Packing Cubes",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "28L The North Face Borealis Commuter Backpack (Fits up to 16\" Laptop, Tan)",
        "price": "$59",
        "note": "+ Free Shipping"
    },
    {
        "name": "Sleeplay App: ResMed AirSense 10 AutoSet CPAP Machine w/ Heated Humidifier",
        "price": "$399",
        "note": "+ Free Shipping"
    },
    {
        "name": "Select PayPal Accounts: Bambu Lab P2S Combo 3D Printer",
        "price": "$799",
        "note": "+ 20% Cash Back + Free S/H"
    },
    {
        "name": "4-Tier Garage Storage Cordless Tool Organizer w/ 8-Slots",
        "price": "$29",
        "note": "+ Free Shipping w/ Prime"
    },
    {
        "name": "$100 Disney, eBay, Home Depot + $10 Best Buy eGift Card (Digital Delivery)",
        "price": "$100",
        "note": "& More"
    },
    {
        "name": "Hart 6-Gallon 5HP Corded Wet/Dry Vacuum w/ Car Cleaning Kit (Stainless Steel)",
        "price": "$30",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "NEXPOW OBD2 Car Code Reader Diagnostic Scanner Tool",
        "price": "$8.75",
        "note": ""
    },
    {
        "name": "Hanes Men's Full-Zip EcoSmart Hoodie (Charcoal Heather or Black, Various Sizes)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Signature Fitness Olympic Barbell Weight Bars: 4' Curl $10, 6' Straight",
        "price": "$13",
        "note": ""
    },
    {
        "name": "Prime Members: JVSCAM 3-Speed Cordless Rechargeable Air Duster & Blower",
        "price": "$20",
        "note": "+ Free Shipping"
    },
    {
        "name": "Flashforge Adventurer 5M Wi-Fi 3D Printer w/ Auto Leveling",
        "price": "$163",
        "note": "+ Free S/H"
    },
    {
        "name": "SUNLU AMS Heater 3D Filament Dryer",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "Select Amazon Accounts: Amazon Fire TV Stick 4K Select (newest model)",
        "price": "$10",
        "note": ""
    },
    {
        "name": "Wurkkos HD03 Clip Light 680LM USB C Rechargeable Flashlight",
        "price": "$12",
        "note": "+ Free Shipping"
    },
    {
        "name": "20\" AMYET S8 Dual 1000W Motor 25AH Electric Bike (up to 32mph / 70 miles)",
        "price": "$628",
        "note": "+ Free Shipping"
    },
    {
        "name": "New Mint Mobile Customers: 256GB Pixel 10 Pro XL Smartphone + 1-Yr Unlimited Plan",
        "price": "$579",
        "note": "& More + Free Shipping"
    },
    {
        "name": "Where's Waldo Now? (Paperback Picture Book)",
        "price": "$3.80",
        "note": ""
    },
    {
        "name": "Immortals Fenyx Rising (PC Digital Download)",
        "price": "Free",
        "note": ""
    },
    {
        "name": "2TB Crucial P310 M.2 2230 PCIe Gen4 NVMe Solid State Drive",
        "price": "$130",
        "note": "+ Free Shipping"
    },
    {
        "name": "New Spotify Members Only: 4-Months Spotify Premium Trial Membership (Individual)",
        "price": "Free to Claim",
        "note": "(Valid thru 12/31)"
    },
    {
        "name": "Select PayPal Accounts: Pay Later with PayPal, Get",
        "price": "20% Cash Back",
        "note": ""
    },
    {
        "name": "Apple AirPods Pro 3 Wireless Active Noise Canceling Earbuds",
        "price": "$219",
        "note": "(In-Store Only)"
    },
    {
        "name": "Dollar General In-Store Offer: Roblox Gift Cards",
        "price": "30% Off",
        "note": ""
    },
    {
        "name": "Apple AirTag Item Tracker",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Osprey Daylite Expandable 26+6 Travel Pack (various)",
        "price": "$75",
        "note": "+ Free Shipping"
    },
    {
        "name": "Verizon Apple iPhone 16 Pro 5G Smartphone (Various) w/ $500 Walmart eGift Card",
        "price": "from $25/mos for 36 mos",
        "note": "& More + Free Shipping"
    },
    {
        "name": "G Gradual Men’s Athletic Long Sleeve Quarter-Zip Pullover Shirt (Various Colors)",
        "price": "$14",
        "note": ""
    },
    {
        "name": "Select Amex Platinum Cardholders: Spend $60+ at Walmart.com, Earn",
        "price": "$20 Statement Credit",
        "note": "Valid 2x (up to $40) until 12/31/25"
    },
    {
        "name": "Apple AirPods Pro 2 Wireless Earbuds",
        "price": "$139",
        "note": "+ Free Shipping"
    },
    {
        "name": "Harman Kardon Onyx Studio 8 Portable Stereo Bluetooth Speaker",
        "price": "$100",
        "note": "+ Free Shipping"
    },
    {
        "name": "51mm Garmin fenix 7X Pro GPS Smartwatch (Sapphire Solar Edition)",
        "price": "$425",
        "note": "+ Free Shipping"
    },
    {
        "name": "Philips Sonicare 4100 Rechargeable Electric Toothbrush (Various Colors)",
        "price": "$30",
        "note": ""
    },
    {
        "name": "TP-Link Tapo & Kasa Deals: 2K Solar PTZ Floodlight Camera",
        "price": "$85",
        "note": "& More"
    },
    {
        "name": "CVS Photo: 2-Count 5\"x7\" Custom Glossy Photo Prints",
        "price": "Free",
        "note": "+ Free Store Pickup"
    },
    {
        "name": "Select Costco Locations: Apple Watch Ultra 2 49mm Smartwatch (GPS + Cellular)",
        "price": "$450",
        "note": "(Pricing/Availability Will Vary)"
    },
    {
        "name": "Costco Members: Bose QuietComfort SC Noise Cancelling Headphones (4 Colors)",
        "price": "$170",
        "note": "+ Free S/H"
    },
    {
        "name": "Trade In Select Headphones, Get Bose QuietComfort Ultra Headphones (2nd Gen)",
        "price": "$299",
        "note": "+ Free Shipping"
    },
    {
        "name": "Apple AirTag Item Tracker",
        "price": "$18",
        "note": ""
    },
    {
        "name": "Onlyone 300ml Rechargeable Cordless Water Dental Flosser (Black)",
        "price": "$7.00",
        "note": ""
    },
    {
        "name": "Costco Members: 128GB Meta Quest 3S w/ 12-Month Meta Horizon+ Subscription",
        "price": "$200",
        "note": "+ Free Shipping"
    },
    {
        "name": "Tapo HybridCam Duo 2K 3MP Indoor/Outdoor Dual Lens Pan/Tilt Security Camera",
        "price": "$50",
        "note": "+ Free S&H & More"
    },
    {
        "name": "85\" Toshiba C350 Series LED 4K UHD Smart Fire TV",
        "price": "$600",
        "note": "+ Free Shipping"
    },
    {
        "name": "Select $100 Gift Cards (Apple, Disney, Nintendo, & More) + $10 Target eGift Card",
        "price": "$100",
        "note": ""
    },
    {
        "name": "MaxKare Large Back & Shoulder Heating Pad w/ Auto Shut-off (Gray)",
        "price": "$19",
        "note": ""
    },
    {
        "name": "Costco Stores: Extra Savings on Whole $19.99/lb USDA Prime Boneless Beef Ribeye",
        "price": "$75 Off",
        "note": "(In-Store Only)"
    },
    {
        "name": "Cook With Color Round Bamboo Cutting Board with Locking Lid (2 Shapes)",
        "price": "$12",
        "note": ""
    },
    {
        "name": "Men's & Women's Crocs Clogs (Various Styles)",
        "price": "2 for $50",
        "note": "+ Free S/H Orders $55+"
    },
    {
        "name": "Complete Digital Anime TV Series: HD: Paranoia Agent, Space Dandy, SD: Robotech",
        "price": "$5 each",
        "note": "& More"
    }
]

describe("parseTitle", () => {
    data.forEach((item) => {
        const input = [item.name, item.price, item.note].filter(Boolean).join(' ');
        it(`should parse "${input}"`, () => {
            expect(parseTitle(input)).toEqual(item);
        });
    });
});