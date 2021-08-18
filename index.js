// const dayjs = require("dayjs");
dayjs.extend(window.dayjs_plugin_calendar);

const hour = 1000 * 60 * 60;
const day = hour * 24;
const week = day * 7;
const month = (week * 4) + 2;
let dayShare = 0;
let weekShare = 0;
let monthShare = 0;
let totalShare = 0;
function reduceShare(interval) {
    dayShare += interval.day;
    weekShare += interval.week;
    monthShare += interval.month;
    totalShare += interval.total;
}
function calcShare(interval) {
    interval.dayShare = (interval.day * 100) / dayShare;
    interval.weekShare = (interval.week * 100) / weekShare;
    interval.monthShare = (interval.month * 100) / monthShare;
    interval.totalShare = (interval.total * 100) / totalShare;
    return interval
}
function calcInterval(logs) {
    let interval = {};
    interval.day = 0
    interval.week = 0
    interval.month = 0
    interval.total = 0
    logs.forEach(log => {
        const fromNow = new Date().getTime() - log.from;
        if (fromNow < day) {
            interval.day += log.duration
        }
        if (fromNow < week) {
            interval.week += log.duration
        }
        if (fromNow < month) {
            interval.month += log.duration
        }
        interval.total += log.duration
    });
    return interval
}
function calcDurations(incoming) {
    let newLogs = [];
    const logs = incoming
    if (logs[0] && logs[0].type == 'login') {
        logs.shift()
    }
    const length = logs.length;
    for (let i = 0; i < length / 2; i++) {
        const duration = logs[0].at - logs[1].at;
        newLogs.push({ from: logs[1].at, duration });
        logs.shift()
        logs.shift();
    }
    return newLogs;
}
function sortLogs(logs) {
    logs.sort((x, y) => y.at - x.at)
    return calcDurations(logs)
}
let peopleStore = [];
let visibleItem = '';
function openPerson(idd) {
    if (visibleItem !== idd) {
        visibleItem = idd;
        const query = peopleStore.find(pe => pe.id === idd);
        if (query) {
            const person = query;
            const intr = person.interval;
            id('person').className = 'right'
            id('person').innerHTML = `
        <div class="top">
          <div class="avatar">
            <img src="https://robohash.org/${person.name}" alt="avatar" />
          </div>
          <div class="text">
            <div class="name">${person.name}</div>
            <div class="status ${person.online && 'online'}">${person.online ? 'online' : 'offline'}</div>
          </div>
        </div>
        <div class="bottom">
          <div class="stat">
            <span class="time">Today</span>
            <span class="value">${odp(intr.dayShare)}% · ${parseTime(intr.day)}</span>
          </div>
          <div class="stat">
            <span class="time">Last week</span>
            <span class="value">${odp(intr.weekShare)}% · ${parseTime(intr.week)}</span>
          </div>
          <div class="stat">
            <span class="time">Last month</span>
            <span class="value">${odp(intr.monthShare)}% · ${parseTime(intr.month)}</span>
          </div>
          <div class="stat">
            <span class="time">Total</span>
            <span class="value">${odp(intr.totalShare)}% · ${parseTime(intr.total)}</span>
          </div>
        </div>
        <h3>Logs</h3>
        <div class="log-list" id="log-list">
         ${(person.logData.map(log => { return `<div class="log">${dayjs(log.from).calendar()} for ${parseTime(log.duration)}</div>` })).toString().replace(/,/g, '')}
        </div>
      </div>
        `;
            // id('')
        }
    }

}
function odp(num) {
    const fl = Math.floor(num);

    if (fl === num) return num;
    const tbr = num.toString().split('.')[1].slice(0, 2);
    return Math.floor(num) + '.' + Math.round(Number(tbr[0] + '.' + tbr[1]));
}
ref.get().then((querySnapshot) => {
    let people = [];
    querySnapshot.forEach(async (doc) => {
        let person = {};
        const query = await ref.doc(doc.id).collection("logs").get()
        let logs = []
        query.forEach(log => {
            const logData = log.data();
            logs.push({
                logId: log.id,
                at: logData.at,
                type: logData.type
            })
        });
        person.logs = logs;
        person.online = logs.length % 2 !== 0;
        person.logData = sortLogs(logs);
        person.id = doc.id;
        person.name = doc.data().name;
        people.push(person);
    });
    const interval = setInterval(() => {
        if (people.length === querySnapshot.size) {
            clearInterval(interval)
            //available here
            people = people.map(person => {
                person.interval = calcInterval(person.logData)
                return person;
            }).map(person => {
                reduceShare(person.interval)
                return person;
            }).map(person => {
                person.interval = calcShare(person.interval);
                // person.online = person.logs % 2 !== 0
                return person;
            });
            if (people.length) {
                id('people').className = 'left';
                id('people').innerHTML = ''
                peopleStore = people;
                id('top-total').className = 'total';
                id('top-total').innerHTML = `
                    <span><i>total</i> ${Math.floor(totalShare / hour)}h</span> · 
                    <span><i>today</i> ${Math.floor(dayShare / hour)}h</span> ·
                    <span><i>last week</i> ${Math.floor(weekShare / hour)}h</span> · 
                    <span><i>last month</i> ${Math.floor(monthShare / hour)}h</span>`
            }
            people.sort((x, y) => {
                return y.logData[0].from - x.logData[0].from;
            })
            people.sort((x, y) => {
                if (x.online) {
                    return -1;
                }
                if (y.online) {
                    return 1;
                }
                return 0
            })
            people.forEach(person => {
                id('people').innerHTML += `
                <div class="person" onclick="openPerson('${person.id}')">
                <div class="avatar">
                <img src="https://robohash.org/${person.name}" alt="avatar" />
                </div>
                <div class="text">
                <div class="name">${person.name}</div>
                <div class="des">${odp(person.interval.totalShare)}% · ${parseTime(person.interval.total)}</div>
                </div>
                ${person.online ? '<div class="indicator"></div>' : ''}
                </div>`
            });

            console.log(people);
        }
    }, 100);
});