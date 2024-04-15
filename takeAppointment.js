const takeAppointment = (timeZone) => {
  const parent = document.getElementById("takeAppointment");
  const div = document.createElement("div");
  div.classList = "flex items-center justify-center border";
  div.innerHTML = `
    <form>
    <input id="onlineCheckbox" type="checkbox" />
   <p>Online</p> 
    <input id="offlineCheckbox" type="checkbox" />
   <p>Offline</p> 
    <label>Symptoms</label>
    <input class="border border-red-500" />

    </form>
    `;
  parent.appendChild(div);
};

takeAppointment();

const onlineCheckbox = document.getElementById("onlineCheckbox");
const offlineCheckbox = document.getElementById("offlineCheckbox");

onlineCheckbox.addEventListener("change", function () {
  offlineCheckbox.checked = !this.checked; // Ensure only one is checked
});

offlineCheckbox.addEventListener("change", function () {
  onlineCheckbox.checked = !this.checked; // Ensure only one is checked
});
