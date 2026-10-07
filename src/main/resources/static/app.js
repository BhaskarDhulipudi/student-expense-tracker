const DB_NAME = "studentExpenseTracker";
const DB_VERSION = 1;
const STORE = "expenses";

const $ = id => document.getElementById(id);

const pad = n => String(n).padStart(2, "0");

const now = new Date();

const monthNow =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

const today =
  `${monthNow}-${pad(now.getDate())}`;

$("month").value = monthNow;
$("date").value = today;


/* =========================================================
   HELPERS
========================================================= */

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}


function createId() {

    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" +
        Math.random().toString(16).slice(2);
}


/* =========================================================
   INDEXED DB
========================================================= */

function openDB() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {

            const database = request.result;

            if (!database.objectStoreNames.contains(STORE)) {

                database.createObjectStore(
                    STORE,
                    {
                        keyPath: "clientId"
                    }
                );
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getAllExpenses() {

    const database = await openDB();

    return new Promise((resolve, reject) => {

        const request =
            database
                .transaction(STORE, "readonly")
                .objectStore(STORE)
                .getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function saveExpense(expense) {

    const database = await openDB();

    return new Promise((resolve, reject) => {

        const transaction =
            database.transaction(
                STORE,
                "readwrite"
            );

        transaction
            .objectStore(STORE)
            .put(expense);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}


/* =========================================================
   NETWORK STATUS
========================================================= */

function updateNetworkStatus() {

    const online = navigator.onLine;

    const networkElement = $("network");

    if (!networkElement) {
        return;
    }

    networkElement.className =
        "status " +
        (online ? "online" : "offline");

    const last =
        networkElement.querySelector(
            "span:last-child"
        );

    if (last) {
        last.textContent =
            online ? "Online" : "Offline";
    }

    if (!online) {

        setSyncMessage(
            "Offline — saved on this device"
        );
    }
}


function setSyncMessage(message) {

    const syncText = $("syncText");

    if (syncText) {
        syncText.textContent = message;
    }
}


window.addEventListener(
    "online",
    () => {

        updateNetworkStatus();

        /*
         * Internet is back.
         * Synchronize immediately.
         */
        syncWithCloud();
    }
);


window.addEventListener(
    "offline",
    () => {

        updateNetworkStatus();

        setSyncMessage(
            "Offline — saved on this device"
        );
    }
);


/* =========================================================
   RENDER UI
========================================================= */

async function render() {

    const selectedMonth =
        $("month").value || monthNow;

    /*
     * IMPORTANT:
     *
     * We keep deleted records inside IndexedDB
     * so deletion can propagate to other devices.
     *
     * But we DON'T display deleted records.
     */

    const allExpenses =
        await getAllExpenses();

    const rows =
        allExpenses.filter(expense =>
            !expense.deleted &&
            expense.expenseDate &&
            expense.expenseDate.startsWith(
                selectedMonth
            )
        );


    /* -----------------------------------------
       TOTAL
    ----------------------------------------- */

    const total =
        rows.reduce(
            (sum, expense) =>
                sum + Number(expense.amount || 0),
            0
        );


    /* -----------------------------------------
       DAILY AVERAGE
    ----------------------------------------- */

    const spendingDays =
        new Set(
            rows.map(
                expense => expense.expenseDate
            )
        );


    const dailyAverage =
        spendingDays.size
            ? total / spendingDays.size
            : 0;


    $("total").textContent =
        money(total);


    $("average").textContent =
        money(dailyAverage);


    $("averageHint").textContent =
        `${spendingDays.size} spending day` +
        (spendingDays.size === 1 ? "" : "s");


    $("count").textContent =
        rows.length;


    /* -----------------------------------------
       CATEGORY TOTALS
    ----------------------------------------- */

    const categories = {};

    rows.forEach(expense => {

        const category =
            expense.category || "Other";

        categories[category] =
            (categories[category] || 0) +
            Number(expense.amount || 0);
    });


    const sortedCategories =
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);


    if (sortedCategories.length) {

        $("topCategory").textContent =
            sortedCategories[0][0];

        $("topAmount").textContent =
            money(sortedCategories[0][1]);

    } else {

        $("topCategory").textContent =
            "—";

        $("topAmount").textContent =
            "No spending yet";
    }


    /* -----------------------------------------
       CATEGORY BARS
    ----------------------------------------- */

    if (sortedCategories.length) {

        $("bars").innerHTML =
            sortedCategories.map(
                ([category, amount]) => {

                    const percentage =
                        total > 0
                            ? Math.min(
                                100,
                                amount / total * 100
                            )
                            : 0;

                    return `
                        <div class="barrow">

                            <div class="barhead">

                                <span>
                                    ${esc(category)}
                                </span>

                                <b>
                                    ${money(amount)}
                                </b>

                            </div>

                            <div class="track">

                                <div
                                    class="fill"
                                    style="width:${percentage}%">
                                </div>

                            </div>

                        </div>
                    `;
                }
            ).join("");

    } else {

        $("bars").innerHTML =
            "<div class='empty'>" +
            "No expenses recorded for this month." +
            "</div>";
    }


    /* -----------------------------------------
       RECENT EXPENSES
    ----------------------------------------- */

    rows.sort((a, b) => {

        const dateCompare =
            String(b.expenseDate)
                .localeCompare(
                    String(a.expenseDate)
                );

        if (dateCompare !== 0) {
            return dateCompare;
        }

        return String(b.updatedAt)
            .localeCompare(
                String(a.updatedAt)
            );
    });


    const recent =
        rows.slice(0, 30);


    if (recent.length) {

        $("list").innerHTML =
            recent.map(expense => `

                <div class="expense">

                    <div class="expense-main">

                        <div class="expense-amount">
                            ${money(expense.amount)}
                        </div>

                        <div class="expense-meta">

                            ${esc(expense.category)}
                            ·
                            ${esc(expense.expenseDate)}
                            ·
                            ${esc(expense.paymentMethod)}

                            ${
                                expense.note
                                    ? " · " +
                                      esc(expense.note)
                                    : ""
                            }

                        </div>

                    </div>

                    <button
                        class="delete"
                        data-id="${esc(expense.clientId)}">

                        Delete

                    </button>

                </div>

            `).join("");

    } else {

        $("list").innerHTML =
            "<div class='empty'>" +
            "No expenses recorded for this month." +
            "</div>";
    }
}


/* =========================================================
   CLOUD SYNC
========================================================= */

/*
 * Prevent two sync operations from running
 * at the same time.
 */

let syncInProgress = false;


async function syncWithCloud() {

    /*
     * Don't synchronize if there is no internet.
     */

    if (!navigator.onLine) {

        setSyncMessage(
            "Offline — saved on this device"
        );

        return;
    }


    /*
     * Don't start another sync while one
     * is already running.
     */

    if (syncInProgress) {
        return;
    }


    syncInProgress = true;

    setSyncMessage("Syncing…");


    try {

        /* =================================================
           STEP 1
           GET LOCAL DATA
        ================================================= */

        const localExpenses =
            await getAllExpenses();


        /* =================================================
           STEP 2
           UPLOAD LOCAL DATA
           
           This includes deleted records.
           
           VERY IMPORTANT:
           
           We DO NOT filter:
           
           deleted === true
           
           because deleted records must reach
           the cloud so the other device can
           learn about the deletion.
        ================================================= */

        for (const expense of localExpenses) {

            const response =
                await fetch(
                    "/api/expenses",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(expense)
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to upload expense"
                );
            }
        }


        /* =================================================
           STEP 3
           DOWNLOAD CLOUD DATA
        ================================================= */

        const response =
            await fetch(
                "/api/expenses",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to download expenses"
            );
        }


        const remoteExpenses =
            await response.json();


        /* =================================================
           STEP 4
           MERGE CLOUD DATA INTO LOCAL DATABASE
           
           IMPORTANT:
           
           Deleted records are also saved locally.
           
           This means:
           
           Laptop deletes
                  ↓
           Cloud deleted=true
                  ↓
           Mobile downloads deleted=true
                  ↓
           Mobile IndexedDB stores it
                  ↓
           render() hides it
           
           Same works in reverse.
        ================================================= */

        const latestLocal =
            await getAllExpenses();


        for (const remoteExpense of remoteExpenses) {

            const localExpense =
                latestLocal.find(
                    local =>
                        local.clientId ===
                        remoteExpense.clientId
                );


            /*
             * If local copy doesn't exist,
             * save cloud copy.
             */

            if (!localExpense) {

                await saveExpense(
                    remoteExpense
                );

                continue;
            }


            /*
             * Compare timestamps.
             *
             * Cloud record wins when it is
             * newer OR exactly the same time.
             */

            const remoteTime =
                new Date(
                    remoteExpense.updatedAt || 0
                ).getTime();


            const localTime =
                new Date(
                    localExpense.updatedAt || 0
                ).getTime();


            if (remoteTime >= localTime) {

                await saveExpense(
                    remoteExpense
                );
            }
        }


        /* =================================================
           STEP 5
           REFRESH SCREEN
        ================================================= */

        await render();


        setSyncMessage(
            "Synced just now"
        );


        const message =
            $("message");

        if (message) {

            message.textContent =
                "✓ Synced successfully.";
        }


    } catch (error) {

        console.error(
            "Cloud sync error:",
            error
        );


        /*
         * Don't lose local data.
         */

        setSyncMessage(
            "Sync unavailable — changes kept locally"
        );


    } finally {

        syncInProgress = false;
    }
}


/* =========================================================
   ADD EXPENSE
========================================================= */

$("expenseForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const amount =
            Number(
                $("amount").value
            );


        if (!amount || amount <= 0) {

            $("message").textContent =
                "Enter a valid amount.";

            return;
        }


        const expense = {

            clientId:
                createId(),

            category:
                $("category").value,

            amount:
                amount,

            expenseDate:
                $("date").value,

            note:
                $("note").value.trim(),

            paymentMethod:
                $("payment").value,

            deleted:
                false,

            updatedAt:
                new Date().toISOString()
        };


        /*
         * Save locally FIRST.
         *
         * This guarantees offline support.
         */

        await saveExpense(
            expense
        );


        $("amount").value = "";
        $("note").value = "";


        $("message").textContent =
            "✓ Expense added.";


        await render();


        /*
         * If online, immediately upload.
         */

        if (navigator.onLine) {

            await syncWithCloud();
        }
    }
);


/* =========================================================
   MONTH CHANGE
========================================================= */

$("month").addEventListener(
    "change",
    async () => {

        const selectedMonth =
            $("month").value;


        if (selectedMonth) {

            if (
                selectedMonth === monthNow
            ) {

                $("date").value =
                    today;

            } else {

                $("date").value =
                    `${selectedMonth}-01`;
            }
        }


        await render();
    }
);


/* =========================================================
   MANUAL SYNC
========================================================= */

$("syncBtn").addEventListener(
    "click",
    async () => {

        await syncWithCloud();
    }
);


/* =========================================================
   DELETE EXPENSE
========================================================= */

$("list").addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                ".delete"
            );


        if (!button) {
            return;
        }


        const clientId =
            button.dataset.id;


        const expenses =
            await getAllExpenses();


        const expense =
            expenses.find(
                item =>
                    item.clientId ===
                    clientId
            );


        if (!expense) {
            return;
        }


        /*
         * VERY IMPORTANT:
         *
         * DO NOT remove the record from IndexedDB.
         *
         * Instead mark it deleted.
         *
         * This allows the deletion to be
         * synchronized to the cloud and then
         * to the other device.
         */

        expense.deleted = true;

        expense.updatedAt =
            new Date().toISOString();


        await saveExpense(
            expense
        );


        /*
         * Immediately hide it from this device.
         */

        await render();


        $("message").textContent =
            "✓ Expense deleted.";


        /*
         * Upload deletion immediately
         * when internet is available.
         */

        if (navigator.onLine) {

            await syncWithCloud();
        }
    }
);


/* =========================================================
   AUTOMATIC SYNCHRONIZATION
========================================================= */

/*
 * Every 10 seconds:
 *
 * Laptop  ←→  Cloud
 * Mobile  ←→  Cloud
 *
 * This handles both additions and deletions.
 */

setInterval(
    () => {

        if (navigator.onLine) {

            syncWithCloud();
        }

    },
    10000
);


/*
 * Synchronize when user comes back
 * to the browser.
 */

window.addEventListener(
    "focus",
    () => {

        if (navigator.onLine) {

            syncWithCloud();
        }
    }
);


/*
 * Synchronize when the PWA becomes visible again.
 */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible" &&
            navigator.onLine
        ) {

            syncWithCloud();
        }
    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

updateNetworkStatus();


/*
 * Render local data immediately.
 */

render();


/*
 * Then synchronize with cloud.
 */

if (navigator.onLine) {

    syncWithCloud();
}


/* =========================================================
   SERVICE WORKER
========================================================= */

if ("serviceWorker" in navigator) {

    navigator.serviceWorker
        .register("/sw.js")
        .catch(error => {

            console.error(
                "Service worker registration failed:",
                error
            );
        });
}