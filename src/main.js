const {
  checkPermissions,
  requestPermissions,
  getCurrentPosition,
  watchPosition
} = window.__TAURI__.geolocation;

let permissions = await checkPermissions();
if (
    permissions.location === 'prompt'
    || permissions.location === 'prompt-with-rationale'
) {
  permissions = await requestPermissions(['location']);
}

async function getPrayerTimes(pos) {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedToday = dd + '-' + mm + '-' + yyyy;
    const params = new URLSearchParams();
    params.append("latitude", pos.coords.latitude.toString());
    params.append('longitude', pos.coords.longitude.toString());
    fetch(`https://api.aladhan.com/v1/timings/${formattedToday}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let timings = data.data.timings;
            document.getElementById('fajr').innerHTML = timings.Fajr;
            document.getElementById('zuhr').innerHTML = timings.Dhuhr;
            document.getElementById('asr').innerHTML = timings.Asr;
            document.getElementById('maghrib').innerHTML = timings.Maghrib;
            document.getElementById('isha').innerHTML = timings.Isha;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    fetch(`https://api.aladhan.com/v1/nextPrayer/${formattedToday}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let nextPrayer = Object.keys(data.data.timings)[0];
            document.getElementById(nextPrayer + "-row").classList.add('inter-bold');
            document.querySelectorAll(`#${nextPrayer}-row > .border-info`).forEach((ele) => {
                ele.setAttribute("class", ele.getAttribute("class").replace("border-info", "border-warning").replace("bg-info", "bg-warning").replace("bg-opacity-10", "bg-opacity-50"));
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

if (permissions.location === 'granted') {
    const pos = await getCurrentPosition();
    getPrayerTimes(pos);
}

function calculateQibla(pos) {
    let lat = pos.coords.latitude;
    let lon = pos.coords.longitude;
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLon = 39.8262 * Math.PI / 180;
    lat = lat * Math.PI / 180;
    lon = lon * Math.PI / 180;

    const numerator = Math.sin(kaabaLon - lon);
    const denominator = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLon - lon);
    let theta = Math.atan2(numerator, denominator) * 180 / Math.PI;

    if (theta < 0) theta += 360;

    return theta;
}

async function qibla() {
    if (permissions.location === 'granted') {
        const pos = await getCurrentPosition();

        watchPosition(
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 0},
            (pos) => {
                let angle = calculateQibla(pos);
                angle = angle - pos.coords.heading;
                document.getElementById('arrow').setAttribute("transform", `rotate(${angle}, 120, 120)`);
            }
        )
    }
}

qibla();

