/*
 * LabTrack Bench: protocol definitions.
 *
 * Each protocol is plain data, so a new SOP is a new entry in this list (no app code changes).
 *
 * Protocol
 *   id, name, kit, vendor, source   – shown on the start screen
 *   maxSamples, barcodes            – sample limits and the barcode names to assign (optional)
 *   params                          – run-wide numbers the calculators use (editable per run)
 *   stages[]                        – { id, title, time, summary, steps[] }
 *
 * Step (every step gets a checkbox)
 *   id, text                        – what to do (may contain <b>, <i>)
 *   tip / warn / stop               – a hint, a caution (shown in red), a safe stopping point
 *   timers: [{ min, label }]        – countdown timers set to the protocol's time
 *   reading / readings: [{ key, label, short, unit, per: 'sample' | 'pool', type, section, optional }]
 *                                   – values typed in at this step (short = sample-journey column name);
 *                                     type/section name the LabTrack record type and section on export;
 *                                     chain: false = not a follow-up of the previous reading in LabTrack
 *   exportSection                   – barcodes / loading steps: LabTrack section to export them into
 *   calc: { type, ... }             – a calculator (see renderCalc in index.html):
 *       normalise  – DNA + water to reach a mass in a fixed volume, per sample
 *       mix        – a reaction table, per tube and as a master mix for all samples + overage
 *       beads      – bead volume from the ratio and the volume being cleaned
 *       wash       – how much wash solution to prepare (80% ethanol is split into ethanol + water)
 *       barcodes   – the barcode given to each sample
 *       pool       – pooled volume and the mass going into it
 *       recovery   – mass recovered per sample from a Qubit reading
 *       loading    – library ng / µL / fmol to load on the flow cell
 *   tube: { per, suffix, what, vessel, keep }
 *                                   – the material goes into a new tube at this step. The new tube is labelled
 *                                     <sample tube code>-<suffix> (per: 'sample') or <run code>-<suffix> (per: 'pool').
 *                                     Every transfer needs its own suffix: stage letters + 1, 2… for each move, C once
 *                                     cleaned (ER1 → ER2 → ERC). what may use {barcode}. keep = a tube you store.
 *                                     A redo adds -R2, -R3… to the tubes made again. Later readings come from the latest tube.
 *   critical: true                  – highlights the step as one people often get wrong
 */
window.BENCH_PROTOCOLS = [
  {
    id: 'ont-nbd114-24',
    name: 'Native Barcoding Kit 24 V14',
    short: 'NBD114.24',
    kit: 'SQK-NBD114.24',
    vendor: 'Oxford Nanopore',
    source: 'Draft built from the ONT SQK-NBD114.24 gDNA protocol (MinION / GridION, R10.4.1). Check every volume against your lab SOP before use.',
    maxSamples: 24,
    barcodes: Array.from({ length: 24 }, (_, i) => 'NB' + String(i + 1).padStart(2, '0')),
    // Asked when the run is set up. Steps use the chosen option through {sizeGoal.field} in their text,
    // and bead calculators can take their ratio from it: ratio: { by: 'sizeGoal', long: 0.4, short: 0.4 }.
    choices: [
      {
        key: 'sizeGoal', question: 'Which fragments do you want to keep?', default: 'long',
        options: [
          { value: 'long', label: 'The longest fragments possible', detail: 'gDNA for long reads. Fragments under ~3 kb are washed away at the end.',
            buffer: 'Long Fragment Buffer (LFB)', short: 'LFB', keepLabel: 'the longest fragments', keeps: 'keeps fragments over ~3 kb' },
          { value: 'short', label: 'Fragments under 3 kb too', detail: 'Amplicons, sheared, degraded or FFPE DNA. Keeps every fragment.',
            buffer: 'Short Fragment Buffer (SFB)', short: 'SFB', keepLabel: 'fragments under 3 kb too', keeps: 'keeps all fragments, short ones included' }
        ]
      }
    ],
    params: [
      { key: 'inputNg', label: 'gDNA input per sample', unit: 'ng', value: 400, step: 10 },
      { key: 'overage', label: 'Master-mix overage', unit: '%', value: 10, step: 5 },
      { key: 'fragLen', label: 'Average fragment length', unit: 'bp', value: 8000, step: 500, hint: 'Used for fmol when no library TapeStation size is entered.' },
      { key: 'targetFmol', label: 'Library to load', unit: 'fmol', value: 20, step: 1, hint: 'ONT suggests 10–20 fmol for a MinION / GridION flow cell.' }
    ],
    stages: [
      /* ------------------------------------------------------------------ */
      {
        id: 'prep', title: 'Before you start', time: '~10 min',
        summary: 'Thaw reagents and check the input DNA.',
        steps: [
          { id: 'prep-thaw', text: 'Thaw <b>DNA Control Sample (DCS)</b> at room temperature, spin down, mix by pipetting and keep on ice.' },
          { id: 'prep-neb', text: 'Thaw the <b>NEBNext FFPE DNA Repair Mix</b> and <b>Ultra II End-Prep</b> reagents on ice.',
            tip: 'The FFPE Repair Buffer and End-Prep Reaction Buffer can form a precipitate: warm briefly to room temperature and vortex until it is gone, then put them back on ice.' },
          { id: 'prep-beads', text: 'Take the <b>AMPure XP beads (AXP)</b> out of the fridge to reach room temperature, and vortex to resuspend them fully.',
            tip: 'Cold or settled beads give the wrong ratio. Vortex again right before every bead step.' },
          { id: 'prep-qc', text: 'Quantify each gDNA sample with <b>Qubit dsDNA BR</b>, and run a <b>TapeStation</b> (Genomic DNA ScreenTape) if you can.',
            readings: [
              { key: 'qInput', label: 'Input Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Input DNA QC' },
              { key: 'tsInput', label: 'Input TapeStation peak size', short: 'Input size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'Input DNA QC', optional: true, chain: false },
              { key: 'dinInput', label: 'Input DIN', short: 'DIN', unit: 'DIN', per: 'sample', type: 'TapeStation', section: 'Input DNA QC', optional: true, chain: false }
            ],
            tip: 'A DIN under ~7 means degraded DNA: consider keeping fragments under 3 kb (SFB) in settings.' }
        ]
      },
      /* ------------------------------------------------------------------ */
      {
        id: 'endprep', title: 'DNA repair & end-prep', time: '~35 min',
        summary: 'Repair the DNA and make the ends ready for barcode ligation, then a 1× bead clean-up.',
        steps: [
          { id: 'ep-norm', tube: { per: 'sample', suffix: 'ER1', what: 'end-prep reaction (diluted DNA + end-prep mix)', vessel: '0.2 mL PCR tube' }, text: 'In 0.2 mL PCR tubes, dilute each sample to the input mass in <b>11 µL</b> nuclease-free water.',
            calc: { type: 'normalise', readingKey: 'qInput', massParam: 'inputNg', finalVol: 11 } },
          { id: 'ep-mix', text: 'Add the end-prep reagents to each tube (or make a master mix and add <b>3 µL</b> to each 12 µL of DNA).',
            calc: {
              type: 'mix', title: 'End-prep reaction',
              perTube: [{ name: 'DNA (from above)', vol: 11 }, { name: 'DNA CS (optional, or water)', vol: 1 }],
              reagents: [
                { name: 'NEBNext FFPE DNA Repair Buffer', vol: 0.875 },
                { name: 'Ultra II End-Prep Reaction Buffer', vol: 0.875 },
                { name: 'Ultra II End-Prep Enzyme Mix', vol: 0.75 },
                { name: 'NEBNext FFPE DNA Repair Mix', vol: 0.5 }
              ]
            },
            tip: 'Mix by gently flicking or pipetting, then spin down.' },
          { id: 'ep-inc', text: 'Run the end-prep program on the thermal cycler: <b>20 °C for 5 min, then 65 °C for 5 min</b> (10 min in total).',
            timers: [{ min: 10, label: 'end-prep program (20 °C → 65 °C)' }],
            tip: 'Start the timer when you start the program. Leave the beads at room temperature meanwhile.' },
          { id: 'ep-etoh', text: 'While it runs, make fresh <b>80% ethanol</b> for this clean-up.',
            calc: { type: 'wash', reagent: '80% ethanol', perWash: 200, washes: 2, per: 'sample', ethanol: 0.8 } },
          { id: 'ep-transfer', tube: { per: 'sample', suffix: 'ER2', what: 'end-prep reaction moved for the bead clean-up', vessel: '1.5 mL LoBind tube' }, text: 'Transfer each reaction to a clean 1.5 mL DNA LoBind tube.' },
          { id: 'ep-beads', critical: true, text: 'Vortex the AMPure XP beads, then add them to each end-prep reaction (<b>1× ratio</b>). Mix by flicking.',
            calc: { type: 'beads', ratio: 1, volume: 15, per: 'sample', what: 'end-prep reaction' } },
          { id: 'ep-hula', text: 'Incubate on a Hula mixer (rotator) at room temperature.', timers: [{ min: 5, label: 'Hula mixer' }] },
          { id: 'ep-pellet', text: 'Spin down, place on the magnet until the liquid is clear and the beads have pelleted. <b>Pipette off the supernatant</b> without touching the pellet.' },
          { id: 'ep-wash1', text: 'Keep on the magnet and wash the beads with <b>200 µL</b> of 80% ethanol without disturbing the pellet. Remove the ethanol.' },
          { id: 'ep-wash2', text: 'Repeat the wash: <b>200 µL</b> of 80% ethanol, then remove it.' },
          { id: 'ep-dry', critical: true, text: 'Spin down, put back on the magnet, pipette off any residual ethanol. Air-dry about <b>30 s</b>.',
            timers: [{ min: 0.5, label: 'air-dry' }],
            warn: 'Do not over-dry: stop when the pellet loses its shine but before it cracks. Cracked pellets give poor recovery.' },
          { id: 'ep-elute', text: 'Take off the magnet, resuspend the beads in <b>10 µL</b> nuclease-free water. Incubate at room temperature.',
            timers: [{ min: 2, label: 'elution' }] },
          { id: 'ep-collect', tube: { per: 'sample', suffix: 'ERC', what: 'end-prepped DNA, cleaned', vessel: '1.5 mL LoBind tube', keep: true }, text: 'Pellet on the magnet until the eluate is clear, then move <b>10 µL</b> of eluate to a new 1.5 mL LoBind tube.' },
          { id: 'ep-qc', text: 'Quantify <b>1 µL</b> of each end-prepped sample with Qubit.',
            reading: { key: 'qEndprep', label: 'Post end-prep Qubit', short: 'End-prep Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'End-prep clean-up' },
            calc: { type: 'recovery', readingKey: 'qEndprep', eluate: 10, compareKey: 'inputNg', carry: 7.5, carryLabel: 'into barcoding (7.5 µL)' } },
          { id: 'ep-stop', text: 'Continue, or store the end-prepped DNA.', stop: 'Store at 4 °C overnight.' }
        ]
      },
      /* ------------------------------------------------------------------ */
      {
        id: 'barcode', title: 'Native barcode ligation', time: '~60 min',
        summary: 'One barcode per sample, stop with EDTA, pool everything, then a 0.4× bead clean-up.',
        steps: [
          { id: 'bc-thaw', text: 'Thaw the <b>Native Barcodes</b> you need and the <b>EDTA</b> at room temperature. Mix each barcode by pipetting, spin down and keep on ice. Spin down and mix the <b>Blunt/TA Ligase Master Mix</b> by pipetting.' },
          { id: 'bc-assign', critical: true, text: 'Check the barcode for each sample, and label the tubes. Every sample needs a <b>different</b> barcode.',
            calc: { type: 'barcodes' }, exportSection: 'Native barcode ligation' },
          { id: 'bc-mix', tube: { per: 'sample', suffix: 'BC1', what: 'barcode ligation ({barcode})', vessel: '0.2 mL PCR tube' }, text: 'In clean 0.2 mL PCR tubes, set up each barcoding reaction in this order.',
            calc: {
              type: 'mix', title: 'Barcode ligation', noMaster: true,
              perTube: [
                { name: 'End-prepped DNA', vol: 7.5 },
                { name: 'Native Barcode (one per sample)', vol: 2.5 },
                { name: 'Blunt/TA Ligase Master Mix', vol: 10 }
              ],
              reagents: [],
              totals: [{ name: 'Blunt/TA Ligase Master Mix', vol: 10 }]
            },
            tip: 'Do not pre-mix the barcodes. Mix each tube thoroughly by gently pipetting, then spin down.' },
          { id: 'bc-inc', text: 'Incubate at room temperature.', timers: [{ min: 20, label: 'ligation' }] },
          { id: 'bc-etoh', text: 'While the ligation incubates, make fresh <b>80% ethanol</b> for the pooled clean-up. Do not reuse the end-prep ethanol.',
            calc: { type: 'wash', reagent: '80% ethanol', perWash: 700, washes: 2, per: 'pool', ethanol: 0.8 } },
          { id: 'bc-edta', text: 'Add <b>2 µL EDTA</b> to each tube, mix by pipetting and spin down. This stops the reaction.',
            calc: { type: 'mix', title: 'EDTA', noMaster: true, perTube: [{ name: 'EDTA', vol: 2 }], reagents: [], totals: [{ name: 'EDTA', vol: 2 }] } },
          { id: 'bc-pool', tube: { per: 'pool', suffix: 'BP1', what: 'barcoded samples pooled, before clean-up', vessel: '1.5 mL LoBind tube' }, text: 'Pool all the barcoded samples into one 1.5 mL LoBind tube.',
            calc: { type: 'pool', perSample: 22, readingKey: 'qEndprep', carry: 7.5 } },
          { id: 'bc-beads', critical: true, text: 'Vortex the AMPure XP beads, then add <b>0.4×</b> beads to the pool. Mix by flicking.',
            calc: { type: 'beads', ratio: { by: 'sizeGoal', long: 0.4, short: 0.4 }, perSampleVolume: 22, per: 'pool', what: 'pooled reaction',
              why: 'ONT uses 0.4× whichever fragments you keep: the Blunt/TA ligation mix already contains PEG, so 0.4× still binds short barcoded DNA while removing free barcodes.' },
            warn: 'This is 0.4×, not 1×, even if you are keeping short fragments. Using 1× here carries free barcodes into the adapter ligation.' },
          { id: 'bc-hula', text: 'Incubate on a Hula mixer at room temperature.', timers: [{ min: 10, label: 'Hula mixer' }] },
          { id: 'bc-pellet', text: 'Spin down, pellet on the magnet, and pipette off the supernatant.' },
          { id: 'bc-wash1', text: 'Keep on the magnet and wash the beads with <b>700 µL</b> of 80% ethanol. Remove the ethanol.' },
          { id: 'bc-wash2', text: 'Repeat the wash: <b>700 µL</b> of 80% ethanol, then remove it.' },
          { id: 'bc-dry', critical: true, text: 'Spin down, put back on the magnet, pipette off any residual ethanol. Air-dry about <b>30 s</b>.',
            timers: [{ min: 0.5, label: 'air-dry' }], warn: 'Do not let the pellet crack.' },
          { id: 'bc-elute', text: 'Take off the magnet and resuspend in <b>35 µL</b> nuclease-free water. Incubate at <b>37 °C</b>, flicking gently for 10 s every 2 minutes.',
            timers: [{ min: 10, label: '37 °C elution' }] },
          { id: 'bc-collect', tube: { per: 'pool', suffix: 'BPC', what: 'barcoded pool, cleaned', vessel: '1.5 mL LoBind tube', keep: true }, text: 'Pellet on the magnet until clear, then move <b>35 µL</b> of eluate to a new 1.5 mL LoBind tube.' },
          { id: 'bc-qc', text: 'Quantify <b>1 µL</b> of the pool with Qubit.',
            reading: { key: 'qPool', label: 'Pool Qubit', short: 'Pool Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Pooled clean-up' },
            calc: { type: 'recovery', readingKey: 'qPool', eluate: 35, per: 'pool', carry: 30, carryLabel: 'into adapter ligation (30 µL)' } },
          { id: 'bc-stop', text: 'Continue, or store the pooled barcoded DNA.', stop: 'Store at 4 °C overnight.' }
        ]
      },
      /* ------------------------------------------------------------------ */
      {
        id: 'adapter', title: 'Adapter ligation & clean-up', time: '~50 min',
        summary: 'Ligate the Native Adapter to the pool, then a 0.4× clean-up washed with {sizeGoal.short} (never ethanol).',
        steps: [
          { id: 'ad-thaw', text: 'Spin down the <b>Native Adapter (NA)</b> and <b>Quick T4 DNA Ligase</b> and keep on ice. Thaw <b>NEBNext Quick Ligation Buffer</b>, <b>Elution Buffer (EB)</b> and <b>{sizeGoal.buffer}</b> at room temperature, mix, spin down, then keep on ice.',
            tip: 'You chose to keep <b>{sizeGoal.keepLabel}</b>, so this run uses <b>{sizeGoal.short}</b>: it {sizeGoal.keeps}. Change it in settings.' },
          { id: 'ad-mix', tube: { per: 'pool', suffix: 'AL1', what: 'adapter ligation', vessel: '1.5 mL LoBind tube' }, text: 'In a 1.5 mL LoBind tube, add in this order:',
            calc: {
              type: 'mix', title: 'Adapter ligation', noMaster: true,
              perTube: [
                { name: 'Pooled barcoded DNA', vol: 30 },
                { name: 'Native Adapter (NA)', vol: 5 },
                { name: 'NEBNext Quick Ligation Buffer (5×)', vol: 10 },
                { name: 'Quick T4 DNA Ligase', vol: 5 }
              ],
              reagents: []
            },
            tip: 'Mix by gently flicking, then spin down.' },
          { id: 'ad-inc', text: 'Incubate at room temperature.', timers: [{ min: 20, label: 'ligation' }] },
          { id: 'ad-beads', critical: true, text: 'Vortex the AMPure XP beads and add <b>0.4×</b> to the ligation. Mix by flicking.',
            calc: { type: 'beads', ratio: { by: 'sizeGoal', long: 0.4, short: 0.4 }, volume: 50, per: 'pool', what: 'adapter ligation',
              why: 'Same 0.4× for both choices: here the size selection is done by the wash buffer ({sizeGoal.short}), not the bead ratio.' } },
          { id: 'ad-hula', text: 'Incubate on a Hula mixer at room temperature.', timers: [{ min: 10, label: 'Hula mixer' }] },
          { id: 'ad-pellet', text: 'Spin down, pellet on the magnet, and pipette off the supernatant.' },
          { id: 'ad-wash1', critical: true, text: 'Add <b>125 µL</b> of <b>{sizeGoal.short}</b>. Flick to resuspend, spin down, then pellet on the magnet and remove the supernatant.',
            calc: { type: 'wash', reagent: '{sizeGoal.buffer}', perWash: 125, washes: 2, per: 'pool' },
            warn: 'Do NOT use ethanol here. Ethanol denatures the motor protein on the adapter and the library will not sequence.' },
          { id: 'ad-wash2', text: 'Repeat the wash: <b>125 µL</b> of <b>{sizeGoal.short}</b>, then remove it.' },
          { id: 'ad-dry', text: 'Spin down, put back on the magnet, pipette off any residual buffer. Air-dry about <b>30 s</b>.',
            timers: [{ min: 0.5, label: 'air-dry' }] },
          { id: 'ad-elute', text: 'Take off the magnet and resuspend in <b>15 µL</b> Elution Buffer (EB). Incubate at <b>37 °C</b>, flicking gently every 2 minutes.',
            timers: [{ min: 10, label: '37 °C elution' }] },
          { id: 'ad-collect', tube: { per: 'pool', suffix: 'ALC', what: 'final library (adapter-ligated, cleaned)', vessel: '1.5 mL LoBind tube', keep: true }, text: 'Pellet on the magnet until clear, then move <b>15 µL</b> of eluate (your library) to a new 1.5 mL LoBind tube.' },
          { id: 'ad-qc', text: 'Quantify <b>1 µL</b> of the library with Qubit. Run a <b>TapeStation</b> for the library size if you can: it makes the fmol calculation exact.',
            readings: [
              { key: 'qFinal', label: 'Final library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Final clean-up' },
              { key: 'tsFinal', label: 'Final library size (TapeStation)', short: 'Library size', unit: 'bp', per: 'pool', type: 'TapeStation', section: 'Final clean-up', optional: true, chain: false }
            ] },
          { id: 'ad-dilute', tube: { per: 'pool', suffix: 'LD1', what: 'library diluted for loading', vessel: '1.5 mL LoBind tube' }, critical: true, text: 'In a new LoBind tube, dilute the library in EB to <b>12 µL</b> at the amount to load. Keep the rest of the library tube.',
            calc: { type: 'loading', readingKey: 'qFinal', lengthKey: 'tsFinal', finalVol: 12, diluent: 'EB' }, exportSection: 'Flow cell loading' },
          { id: 'ad-stop', text: 'Load now, or store the library.', stop: 'Store in LoBind tubes at 4 °C for short-term storage (or −80 °C for longer). Sequence as soon as you can.' }
        ]
      },
      /* ------------------------------------------------------------------ */
      {
        id: 'load', title: 'Prime & load the flow cell', time: '~20 min',
        summary: 'MinION / GridION R10.4.1 flow cell. Bubbles are the main way a flow cell is lost.',
        steps: [
          { id: 'fc-thaw', text: 'Thaw <b>Sequencing Buffer (SB)</b>, <b>Library Beads (LIB)</b>, <b>Flow Cell Tether (FCT)</b> and <b>Flow Cell Flush (FCF)</b> at room temperature. Vortex, spin down and keep on ice.' },
          { id: 'fc-check', text: 'Run a <b>flow cell check</b> in MinKNOW and note the number of available pores.',
            reading: { key: 'pores', label: 'Available pores', short: 'Pores', unit: 'pores', per: 'pool', section: 'Flow cell check', chain: false, noTube: true } },
          { id: 'fc-prime-mix', text: 'Make the priming mix: add the FCT (and BSA, if your SOP uses it) straight into the tube of FCF and mix by vortexing.',
            calc: {
              type: 'mix', title: 'Priming mix (one flow cell)', noMaster: true,
              perTube: [
                { name: 'Flow Cell Flush (FCF)', vol: 1170 },
                { name: 'Flow Cell Tether (FCT)', vol: 30 },
                { name: 'BSA 50 mg/mL (optional, per SOP)', vol: 5 }
              ],
              reagents: []
            } },
          { id: 'fc-open', text: 'Slide the flow cell under the clip of the device and press down firmly. Slide the <b>priming port</b> cover clockwise to open it.' },
          { id: 'fc-bubble', critical: true, text: 'Set a P1000 to <b>200 µL</b>, insert the tip into the priming port and turn the wheel up to <b>220–230 µL</b> to draw back a few µL and remove any air bubble.',
            warn: 'Check there is continuous buffer from the priming port across the sensor array. Never draw back more than 20–30 µL, and never let air reach the array.' },
          { id: 'fc-prime1', text: 'Load <b>800 µL</b> of priming mix through the priming port, avoiding air bubbles. Wait 5 minutes.',
            timers: [{ min: 5, label: 'priming' }] },
          { id: 'fc-lib', tube: { per: 'pool', suffix: 'FC1', what: 'library mixed with SB + LIB, ready to load', vessel: '1.5 mL LoBind tube' }, text: 'Mix the Library Beads (LIB) by pipetting right before use, then prepare the library for loading in a new LoBind tube:',
            calc: {
              type: 'mix', title: 'Library for loading', noMaster: true,
              perTube: [
                { name: 'Sequencing Buffer (SB)', vol: 37.5 },
                { name: 'Library Beads (LIB), mixed just before use', vol: 25.5 },
                { name: 'DNA library (from the dilution)', vol: 12 }
              ],
              reagents: []
            } },
          { id: 'fc-prime2', text: 'Gently lift the <b>SpotON sample port</b> cover. Load <b>200 µL</b> of priming mix through the <b>priming port</b> (not the SpotON port), avoiding bubbles.' },
          { id: 'fc-load', critical: true, text: 'Mix the prepared library gently by pipetting, then add <b>75 µL</b> to the <b>SpotON sample port</b> drop by drop. Let each drop flow in before adding the next.',
            warn: 'Do not push the library in. Dropwise only.' },
          { id: 'fc-close', text: 'Gently replace the SpotON cover (bung into the port), close the priming port and close the device lid.' },
          { id: 'fc-run', text: 'In MinKNOW, start the run: kit <b>SQK-NBD114.24</b>, barcoding on, the basecalling model and run time from your SOP.' }
        ]
      }
    ]
  }
];
