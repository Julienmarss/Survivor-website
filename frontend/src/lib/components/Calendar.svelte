<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { eventsList } from "./path/to/your/store";

  import { Calendar } from "@fullcalendar/core";
  import dayGridPlugin from "@fullcalendar/daygrid";
  import interactionPlugin from "@fullcalendar/interaction";

  let calendarEl: HTMLDivElement;

  onMount(() => {
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      locale: "fr",
      events: get(eventsList).map((event) => ({
        id: event.firebaseId,
        title: event.name,
        start: event.dates,
        extendedProps: {
          location: event.location,
          description: event.description,
        },
      })),
      eventClick(info) {
        alert(
          ` ${info.event.title}\n ${info.event.extendedProps.location}\n ${info.event.extendedProps.description || "Pas de description"}`
        );
      },
    });

    calendar.render();
  });
</script>

<div bind:this={calendarEl} class="bg-white p-4 rounded shadow" />
