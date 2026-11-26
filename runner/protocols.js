/*
 * LabTrack Bench: protocol definitions.
 *
 * Each protocol is plain data, so a new SOP is a new entry in this list (no app code changes).
 *
 * Protocol
 *   id, name, kit, vendor, source   – shown on the start screen
 *   maxSamples, barcodes            – sample limits and the barcode names to assign (optional)
 *   params                          – run-wide numbers the calculators use (editable per run)
 *   params[].ask                    – true: also asked on the setup screen (e.g. bead ratio, volumes)
 *                                     Step text can quote run numbers: {p.key}, or a product {p.key*key2};
 *                                     a calc number can be { param: 'key', times: 'key2' }
 *   choices: [{ key, label, question, default, options[] }]
 *                                   – asked at setup; steps use {key.field} in text, { by: key, <value>: x } for
 *                                     numbers, and when: { key: value } to show a step for one answer only
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
 *   tube: { per, suffix, what, vessel, keep, side, from, store }
 *                                   – the material goes into a new tube at this step. The new tube is labelled
 *                                     <sample tube code>-<suffix> (per: 'sample') or <run code>-<suffix> (per: 'pool').
 *                                     Every transfer needs its own suffix: stage letters + 1, 2… for each move, C once
 *                                     cleaned (ER1 → ER2 → ERC). what may use {barcode}. keep = a tube you store.
 *                                     A redo adds -R2, -R3… to the tubes made again. Later readings come from the latest tube.
 *                                     side = a tube that branches off (kept leftovers, a saved wash); the sample stays in
 *                                     its main tube. from: 'start' = filled from the original sample. store = how to keep it.
 *                                     capOnly = write the code on the cap only (e.g. Qubit tubes).
 *   critical: true                  – highlights the step as one people often get wrong
 */
/*
 * Shared step blocks, used by several SOPs.
 *
 * beadCleanup(o) – the lab's Reaction Bead Cleanup (SOP FSD 75-GN-SM11), per sample:
 *   o.id        step id prefix            o.ratio    bead ratio (e.g. 1, 1.2)
 *   o.vol       µL being cleaned          o.what     what is being cleaned ("ligation reaction")
 *   o.tube      '0.2' or '1.5' (sets the ethanol wash volume: 190 or 400 µL)
 *   o.elute     elution µL                o.buffer   elution buffer ("0.1X TE")
 *   o.out       the new tube for the eluate: { suffix, what, keep }
 *   o.beads     bead name (default "sample purification beads")
 */
function beadCleanup(o) {
  const wash = o.tube === '1.5' ? 400 : 190, beads = o.beads || 'sample purification beads';
  const bv = Math.round(o.ratio * o.vol * 100) / 100;
  return [
    { id: o.id + '-etoh', text: 'Make fresh <b>80% ethanol</b> for this clean-up.',
      calc: { type: 'wash', per: 'sample', perWash: wash, washes: 2, ethanol: 0.8 } },
    { id: o.id + '-beads', critical: true, text: `Vortex the ${beads} thoroughly, then add <b>${bv} µL (${o.ratio}×)</b> to each ${o.what}. Mix by pipetting at least 10 times (or vortex 3–5 s), then quick-spin without letting the beads settle.`,
      calc: { type: 'beads', ratio: o.ratio, volume: o.vol, per: 'sample', what: o.what, beadName: beads },
      tip: 'The lower the bead ratio, the larger the fragments kept. 1.2× removes most fragments under ~150 bp.' },
    { id: o.id + '-bind', text: 'Incubate at room temperature.', timers: [{ min: 10, label: 'bead binding' }] },
    { id: o.id + '-pellet', text: `Place on the magnetic stand for ${o.tube === '1.5' ? '1.5 mL' : '0.2 mL'} tubes until the liquid is clear (~1–5 min). <b>Remove and discard the supernatant</b> without disturbing the beads.`,
      warn: 'Do not discard the beads: they hold the DNA.' },
    { id: o.id + '-wash1', text: `Still on the magnet, add <b>${wash} µL of 80% ethanol</b>, wait 30 s, then remove and discard it.`, timers: [{ min: 0.5, label: 'ethanol wash' }] },
    { id: o.id + '-wash2', text: `Repeat: <b>${wash} µL of 80% ethanol</b>, 30 s, remove it. Take off any ethanol left with a P10.`, timers: [{ min: 0.5, label: 'ethanol wash' }] },
    { id: o.id + '-dry', critical: true, text: 'Air-dry the beads on the magnet with the lid open, <b>up to 5 min</b>.', timers: [{ min: 5, label: 'drying (max)' }],
      warn: 'Do not over-dry: the beads should be dark brown and glossy. Cracked or light brown beads are too dry.' },
    { id: o.id + '-elute', text: `Take the tube off the magnet and add <b>${o.elute} µL of ${o.buffer}</b>. Mix by pipetting at least 10 times (or vortex), quick-spin if needed, and incubate on the bench.`,
      timers: [{ min: 5, label: 'elution' }] },
    { id: o.id + '-collect', tube: Object.assign({ per: 'sample', vessel: o.outVessel || '0.2 mL PCR tube' }, o.out),
      text: `Put it back on the magnet until the liquid is clear (~5 min), then move the <b>eluate (${o.elute} µL)</b> to a new tube without taking any beads.` }
  ];
}
const NEB_UDI_WELLS = Array.from({ length: 96 }, (_, i) => 'ABCDEFGH'[i % 8] + (Math.floor(i / 8) + 1));

/*
 * nbd(kit) – ONT Native Barcoding, lab SOP FSD 75-GN-SM07 (version of the ONT protocol dated 02/07/2025).
 * One SOP covers both kits; kit '24' or '96' sets the barcoding volumes, EDTA, barcodes and sample limit.
 */
function nbd(kit) {
  const k96 = kit === '96';
  const bc = k96 ? { water: 3, dna: 0.75, nb: 1.25, mm: 5, total: 10 } : { water: 0, dna: 7.5, nb: 2.5, mm: 10, total: 20 };
  const edta = k96 ? { clear: 1, blue: 2 } : { clear: 2, blue: 4 };
  const ifClean = k96 ? { epClean: 'yes' } : null;          // the 96 kit skips the end-prep clean-up unless you pause there
  const flick = [1, 2, 3, 4, 5].map((i) => ({ min: 2, label: i < 5 ? `37 °C · flick at ${i * 2} min` : '37 °C · done at 10 min' }));
  const choices = [
    { key: 'sizeGoal', label: 'Keeping', question: 'Which fragments do you want to keep?', default: 'long',
      options: [
        { value: 'long', label: 'Fragments of 3 kb or longer', short: 'LFB', detail: 'Long Fragment Buffer for the washes after adapter ligation: enriches for 3 kb and longer.',
          buffer: 'Long Fragment Buffer (LFB)', abbr: 'LFB' },
        { value: 'all', label: 'All fragment sizes', short: 'SFB', detail: 'Short Fragment Buffer for the washes after adapter ligation: keeps fragments of all sizes.',
          buffer: 'Short Fragment Buffer (SFB)', abbr: 'SFB' }
      ] },
    { key: 'edta', label: 'EDTA cap', question: 'What colour is the cap on your EDTA tube?', default: 'clear',
      options: [
        { value: 'clear', label: 'Clear cap', short: `${edta.clear} µL per sample`, detail: `Add ${edta.clear} µL of EDTA to each barcoding reaction.`, vol: String(edta.clear) },
        { value: 'blue', label: 'Blue cap', short: `${edta.blue} µL per sample`, detail: `Add ${edta.blue} µL of EDTA to each barcoding reaction.`, vol: String(edta.blue) }
      ] }
  ];
  if (k96) choices.push({ key: 'epClean', label: 'End-prep clean-up', question: 'Will you stop overnight after end-prep?', default: 'no',
    options: [
      { value: 'no', label: 'No: carry straight on', short: 'no clean-up', detail: 'With the 96 kit the end-prep clean-up is skipped: the end-prep reaction goes straight into barcoding.' },
      { value: 'yes', label: 'Yes: clean up and store at 4 °C', short: 'with clean-up', detail: 'Do the 1× bead clean-up after end-prep, then you can store the samples at 4 °C overnight.' }
    ] });
  return {
    id: 'ont-nbd114-' + kit,
    name: `Native Barcoding Kit ${kit} V14`,
    short: 'NBD114.' + kit,
    kit: 'SQK-NBD114.' + kit,
    vendor: 'Oxford Nanopore · SOP FSD 75-GN-SM07',
    source: 'From the lab SOP FSD 75 - GN - SM07 (issue 1, 30-12-2025; ONT protocol version 02/07/2025). Loading is in the MinION/GridION loading SOP (SM14).',
    maxSamples: k96 ? 96 : 24,
    barcodes: Array.from({ length: k96 ? 96 : 24 }, (_, i) => 'NB' + String(i + 1).padStart(2, '0')),
    choices,
    params: [
      { key: 'inputNg', label: 'DNA per barcode', unit: 'ng', value: 400 },
      { key: 'inputNgFew', label: 'DNA per barcode, 4 samples or fewer', unit: 'ng', value: 1000 },
      { key: 'overage', label: 'Extra in master mixes', unit: '%', value: 10 },
      { key: 'fragLen', label: 'Default library length', unit: 'bp', value: 8000, hint: 'used for the loading amount when there is no library TapeStation size' }
    ],
    stages: [
      {
        id: 'prep', title: 'Before you start', time: '~15 min',
        summary: 'Pre-PCR room (this protocol is for genomic DNA). 400 ng per barcode, or 1000 ng if you run 4 samples or fewer.',
        steps: [
          { id: 'prep-qc', text: 'QC your samples: <b>Qubit</b> each one, and run a <b>TapeStation</b>.',
            readings: [
              { key: 'qInput', label: 'Input Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Input DNA QC' },
              { key: 'tsInput', label: 'Input TapeStation peak size', short: 'Input size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'Input DNA QC', optional: true, chain: false },
              { key: 'dinInput', label: 'Input DIN', short: 'DIN', unit: 'DIN', per: 'sample', type: 'TapeStation', section: 'Input DNA QC', optional: true, chain: false }
            ] }
        ]
      },
      {
        id: 'endprep', title: 'DNA repair & end-prep', time: '~25 min',
        summary: '12 µL DNA + 3 µL repair/end-prep mix = 15 µL. 20 °C 5 min, then 65 °C 5 min.',
        steps: [
          { id: 'ep-thaw', text: 'Thaw the <b>AMPure XP Beads (AXP)</b> at room temperature, vortex, and keep them at room temperature. Thaw all <b>NEB reagents on ice</b>; flick or invert to mix.',
            warn: 'Do not vortex the FFPE DNA Repair Mix or the Ultra II End Prep Enzyme Mix.',
            tip: 'The End-prep Reaction Buffer and FFPE DNA Repair Buffer may have a little precipitate: let them reach room temperature, pipette up and down, then vortex 30 s. A yellow FFPE buffer is fine.' },
          { id: 'ep-norm', critical: true, tube: { per: 'sample', suffix: 'ER1', what: 'repair & end-prep reaction', vessel: '0.2 mL PCR tube' },
            text: 'In 0.2 mL thin-walled PCR tubes (or a 96-well plate), make each sample up to <b>12 µL</b> with nuclease-free water. Mix gently by pipetting and spin down.',
            calc: { type: 'normalise', readingKey: 'qInput', massParam: 'inputNg', fewParam: 'inputNgFew', fewUpTo: 4, finalVol: 12 } },
          { id: 'ep-mix', text: 'Add the repair and end-prep reagents in this order, pipette mixing 10–20 times after each, or make a master mix and add <b>3 µL</b> to each sample. Mix and spin down.',
            calc: { type: 'mix', title: 'Repair & end-prep', perTube: [{ name: 'DNA (from above)', vol: 12 }],
              reagents: [{ name: 'NEBNext FFPE DNA Repair Buffer', vol: 0.875 }, { name: 'Ultra II End-prep Reaction Buffer', vol: 0.875 }, { name: 'Ultra II End-prep Enzyme Mix', vol: 0.75 }, { name: 'NEBNext FFPE DNA Repair Mix', vol: 0.5 }] } },
          { id: 'ep-inc', text: 'Thermal cycler: <b>20 °C 5 min → 65 °C 5 min</b>.', timers: [{ min: 10, label: 'end-prep program (20 °C → 65 °C)' }] }
        ]
      },
      {
        id: 'epclean', title: 'End-prep clean-up', time: '~20 min',
        summary: k96 ? 'Only if you stop overnight here: 1× beads, elute in 10 µL water.' : '1× beads (15 µL), two 200 µL ethanol washes, elute in 10 µL water.',
        steps: [
          { id: 'ec-transfer', when: ifClean, tube: { per: 'sample', suffix: 'ER2', what: 'end-prep reaction for the bead clean-up', vessel: '1.5 mL DNA LoBind tube' },
            text: 'Transfer each sample into a clean <b>1.5 mL Eppendorf DNA LoBind tube</b>.' },
          { id: 'ec-beads', when: ifClean, critical: true, text: 'Vortex the AXP, then add <b>15 µL</b> to each end-prep reaction (1×). Mix by flicking.',
            calc: { type: 'beads', ratio: 1, volume: 15, per: 'sample', what: 'end-prep reaction' } },
          { id: 'ec-hula', when: ifClean, text: 'Incubate on a Hula mixer at room temperature.', timers: [{ min: 5, label: 'Hula mixer' }] },
          { id: 'ec-etoh', when: ifClean, text: 'Make fresh <b>80% ethanol</b>: 400 µL per sample, with some extra.',
            calc: { type: 'wash', per: 'sample', perWash: 200, washes: 2, ethanol: 0.8 } },
          { id: 'ec-pellet', when: ifClean, text: 'Spin down and pellet on the magnet until the liquid is clear. Keep on the magnet and <b>pipette off the supernatant</b>.' },
          { id: 'ec-wash1', when: ifClean, text: 'On the magnet, wash with <b>200 µL of 80% ethanol</b> without disturbing the pellet. Remove and discard.',
            tip: 'If the pellet moves, wait for it to settle again before removing the ethanol.' },
          { id: 'ec-wash2', when: ifClean, text: 'Repeat: <b>200 µL of 80% ethanol</b>, then remove it.' },
          { id: 'ec-dry', when: ifClean, critical: true, text: 'Spin briefly, back on the magnet, pipette off any ethanol left. Dry for <b>30 s</b>.', timers: [{ min: 0.5, label: 'drying' }],
            warn: 'Do not dry the pellet until it cracks.' },
          { id: 'ec-elute', when: ifClean, text: 'Off the magnet, resuspend in <b>10 µL nuclease-free water</b>. Spin down and incubate at room temperature.', timers: [{ min: 2, label: 'elution' }] },
          { id: 'ec-collect', when: ifClean, tube: { per: 'sample', suffix: 'ERC', what: 'end-prepped DNA, cleaned', vessel: '1.5 mL DNA LoBind tube', keep: true },
            text: 'Pellet on the magnet until clear, then keep <b>10 µL</b> of eluate in a clean 1.5 mL LoBind tube. Discard the beads.' },
          { id: 'ec-qc', when: ifClean, text: 'Quantify <b>1 µL</b> of each sample with Qubit.',
            reading: { key: 'qEndprep', label: 'End-prep Qubit', short: 'End-prep Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'End-prep clean-up' },
            calc: { type: 'recovery', readingKey: 'qEndprep', eluate: 10, carry: bc.dna, carryLabel: `into barcoding (${bc.dna} µL)` } },
          { id: 'ec-stop', when: ifClean, text: 'Continue, or store the end-prepped DNA.', stop: 'Store at 4 °C overnight.' }
        ]
      },
      {
        id: 'barcode', title: 'Native barcode ligation & pooling', time: '~40 min',
        summary: `${bc.total} µL per barcoding reaction, 20 min, then {edta.vol} µL EDTA and pool everything.`,
        steps: [
          { id: 'bc-thaw', text: 'Thaw the <b>Blunt/TA Ligase Master Mix</b> at room temperature, spin 5 s, mix with 10 full-volume pipette mixes, and put on ice. Thaw the <b>EDTA</b> and <b>SFB</b> at room temperature, vortex, spin and put on ice. Thaw the <b>Native Barcodes</b> you need at room temperature, mix each by pipetting, spin and put on ice.' },
          { id: 'bc-assign', critical: true, exportSection: 'Native barcode ligation', text: `Choose a <b>different barcode</b> for every sample on the same flow cell (up to ${kit} samples).`,
            calc: { type: 'barcodes' } },
          { id: 'bc-mix', critical: true, tube: { per: 'sample', suffix: 'BC1', what: 'native barcode ligation ({barcode})', vessel: '0.2 mL PCR tube' },
            text: `In clean 0.2 mL PCR tubes (or a 96-well plate), add in this order, pipette mixing 10–20 times after each: ${k96 ? '<b>3 µL nuclease-free water</b>, ' : ''}<b>${bc.dna} µL end-prepped DNA</b>, <b>${bc.nb} µL Native Barcode</b>, <b>${bc.mm} µL Blunt/TA Ligase Master Mix</b> (${bc.total} µL).`,
            calc: { type: 'mix', title: 'Barcode ligation',
              perTube: (k96 ? [{ name: 'Nuclease-free water', vol: 3 }] : []).concat([{ name: 'End-prepped DNA', vol: bc.dna }, { name: 'Native Barcode (its own)', vol: bc.nb }]),
              reagents: [{ name: 'Blunt/TA Ligase Master Mix', vol: bc.mm }] },
            tip: 'Do not pre-mix the barcodes with anything: each sample gets its own barcode.' },
          { id: 'bc-inc', text: 'Mix gently by pipetting, spin down, and incubate at room temperature.', timers: [{ min: 20, label: 'barcode ligation' }] },
          { id: 'bc-edta', critical: true, text: 'Add <b>{edta.vol} µL EDTA</b> ({edta.label}) to each reaction, mix by pipetting and spin down. This stops the reaction.',
            calc: { type: 'mix', title: 'EDTA', noMaster: true, perTube: [{ name: 'EDTA', vol: { by: 'edta', clear: edta.clear, blue: edta.blue } }], totals: [{ name: 'EDTA', vol: { by: 'edta', clear: edta.clear, blue: edta.blue } }] },
            tip: `EDTA volume depends on the cap: clear ${edta.clear} µL, blue ${edta.blue} µL.` },
          { id: 'bc-pool', tube: { per: 'pool', suffix: 'BP1', what: 'barcoded samples pooled, before clean-up', vessel: '1.5 mL DNA LoBind tube' },
            text: 'Pool all the barcoded samples in a <b>1.5 mL DNA LoBind tube</b>.',
            calc: { type: 'pool', perSample: { by: 'edta', clear: bc.total + edta.clear, blue: bc.total + edta.blue }, readingKey: 'qEndprep', carry: bc.dna, perText: `${bc.total} µL reaction + {edta.vol} µL EDTA` },
            tip: 'Check that the liquid levels in all tubes look the same before and after pooling, so everything goes into the pool.' }
        ]
      },
      {
        id: 'poolclean', title: 'Pooled sample clean-up', time: '~40 min',
        summary: '0.4× AXP on the whole pool, two 700 µL SFB washes, elute in 35 µL water at 37 °C.',
        steps: [
          { id: 'pc-beads', critical: true, text: 'Vortex the AXP and add <b>0.4×</b> of the pooled volume. Mix by pipetting.',
            calc: { type: 'beads', ratio: 0.4, perSampleVolume: { by: 'edta', clear: bc.total + edta.clear, blue: bc.total + edta.blue }, per: 'pool', what: 'pooled sample' } },
          { id: 'pc-hula', text: 'Incubate on a Hula mixer at room temperature.', timers: [{ min: 10, label: 'Hula mixer' }] },
          { id: 'pc-pellet', text: 'Spin down and pellet on the magnet for 5 min, until the liquid is clear. <b>Pipette off the supernatant</b>.', timers: [{ min: 5, label: 'magnet' }] },
          { id: 'pc-wash1', critical: true, text: 'On the magnet, wash the beads with <b>700 µL Short Fragment Buffer (SFB)</b> without disturbing the pellet. Remove and discard.',
            calc: { type: 'wash', per: 'pool', perWash: 700, washes: 2, reagent: 'Short Fragment Buffer (SFB)' },
            warn: 'SFB here, not ethanol: the SOP uses SFB for the clean-ups after native barcoding.' },
          { id: 'pc-wash2', text: 'Repeat: <b>700 µL SFB</b>, then remove it.' },
          { id: 'pc-dry', text: 'Spin down, back on the magnet, and pipette off any buffer left.' },
          { id: 'pc-elute', text: 'Off the magnet, resuspend in <b>35 µL nuclease-free water</b> by gently flicking. Incubate <b>10 min at 37 °C</b>, flicking gently for 10 s every 2 min.', timers: flick },
          { id: 'pc-collect', tube: { per: 'pool', suffix: 'BPC', what: 'barcoded pool, cleaned', vessel: '1.5 mL DNA LoBind tube', keep: true },
            text: 'Pellet on the magnet until clear, then keep <b>35 µL</b> of eluate in a clean 1.5 mL LoBind tube.' },
          { id: 'pc-qc', text: 'Quantify <b>1 µL</b> of the pool with Qubit.',
            reading: { key: 'qPool', label: 'Pool Qubit', short: 'Pool Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Barcoded pool clean-up' },
            calc: { type: 'recovery', per: 'pool', readingKey: 'qPool', eluate: 35, carry: 30, carryLabel: 'into adapter ligation (30 µL)' } },
          { id: 'pc-stop', text: 'Continue, or store the pooled barcoded DNA.', stop: 'Store at 4 °C overnight.' }
        ]
      },
      {
        id: 'adapter', title: 'Adapter ligation & clean-up', time: '~50 min',
        summary: '30 µL pool + 5 µL NA + 10 µL Quick Ligation Buffer + 5 µL Quick T4 Ligase = 50 µL. 20 µL AXP, two 125 µL {sizeGoal.abbr} washes, 15 µL EB at 37 °C.',
        steps: [
          { id: 'ad-thaw', text: 'Thaw the <b>NEBNext Quick Ligation Reaction Buffer (5×)</b> at room temperature, spin 5 s and pipette mix 10 times. Spin down the <b>Native Adapter (NA)</b> and <b>Quick T4 DNA Ligase</b>, pipette mix and put on ice. Thaw the <b>Elution Buffer (EB)</b> at room temperature, vortex, spin and put on ice. Thaw the <b>{sizeGoal.buffer}</b> at room temperature, vortex, spin and keep it at room temperature.',
            warn: 'Do not vortex the Quick T4 DNA Ligase.',
            tip: 'The Quick Ligation Buffer may have a little precipitate: let it reach room temperature, pipette up and down, then vortex a few seconds.' },
          { id: 'ad-mix', critical: true, tube: { per: 'pool', suffix: 'AL1', what: 'adapter ligation', vessel: '1.5 mL DNA LoBind tube' },
            text: 'In a 1.5 mL LoBind tube, add in this order, pipette mixing 10–20 times after each: <b>30 µL pooled barcoded DNA</b>, <b>5 µL Native Adapter (NA)</b>, <b>10 µL Quick Ligation Reaction Buffer (5×)</b>, <b>5 µL Quick T4 DNA Ligase</b> (50 µL). Mix gently and spin briefly.',
            calc: { type: 'mix', title: 'Adapter ligation', noMaster: true,
              perTube: [{ name: 'Pooled barcoded DNA', vol: 30 }, { name: 'Native Adapter (NA)', vol: 5 }, { name: 'Quick Ligation Reaction Buffer (5×)', vol: 10 }, { name: 'Quick T4 DNA Ligase', vol: 5 }] } },
          { id: 'ad-inc', text: 'Incubate at room temperature.', timers: [{ min: 20, label: 'adapter ligation' }] },
          { id: 'ad-beads', critical: true, text: 'Vortex the AXP and add <b>20 µL</b> to the ligation. Mix by pipetting.',
            calc: { type: 'beads', ratio: 0.4, volume: 50, per: 'pool', what: 'adapter ligation' } },
          { id: 'ad-hula', text: 'Incubate on a Hula mixer at room temperature.', timers: [{ min: 10, label: 'Hula mixer' }] },
          { id: 'ad-pellet', text: 'Spin down and pellet on the magnet. Keep it on the magnet and <b>pipette off the supernatant</b>.' },
          { id: 'ad-wash1', critical: true, text: 'Wash with <b>125 µL {sizeGoal.abbr}</b>: flick to resuspend, spin down, back on the magnet to pellet, then remove and discard the supernatant.',
            calc: { type: 'wash', per: 'pool', perWash: 125, washes: 2, reagent: '{sizeGoal.buffer}' },
            warn: 'Use {sizeGoal.abbr}, never ethanol: ethanol damages the adapter.' },
          { id: 'ad-wash2', text: 'Repeat: <b>125 µL {sizeGoal.abbr}</b>, flick, spin, magnet, remove.' },
          { id: 'ad-dry', text: 'Spin down, back on the magnet, and pipette off anything left.' },
          { id: 'ad-elute', text: 'Off the magnet, resuspend in <b>15 µL Elution Buffer (EB)</b>. Spin down and incubate <b>10 min at 37 °C</b>, flicking gently for 10 s every 2 min.', timers: flick },
          { id: 'ad-collect', tube: { per: 'pool', suffix: 'ALC', what: 'final library (adapter-ligated, cleaned)', vessel: '1.5 mL DNA LoBind tube', keep: true },
            text: 'Pellet on the magnet until clear (at least 1 min), then keep <b>15 µL</b> of eluate (your library) in a clean 1.5 mL LoBind tube. Discard the beads.' },
          { id: 'ad-qc', text: 'Quantify <b>1 µL</b> of the library with Qubit. Add a <b>TapeStation</b> size if you have one: it sets the loading amount.',
            readings: [
              { key: 'qFinal', label: 'Final library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Adapter ligation' },
              { key: 'tsFinal', label: 'Final library size (TapeStation)', short: 'Library size', unit: 'bp', per: 'pool', type: 'TapeStation', section: 'Adapter ligation', optional: true, chain: false }
            ] },
          { id: 'ad-dilute', critical: true, exportSection: 'Flow cell loading', tube: { per: 'pool', suffix: 'LD1', what: 'library in 12 µL EB, ready to load', vessel: '1.5 mL DNA LoBind tube' },
            text: 'Make up the final library in <b>12 µL Elution Buffer (EB)</b>, with the amount for its fragment length. If the yield is below that, load the entire library.',
            calc: { type: 'loading', readingKey: 'qFinal', lengthKey: 'tsFinal', finalVol: 12, diluent: 'EB', libVol: 15,
              bands: [{ below: 1000, fmol: 100, label: 'Very short (<1 kb)', text: '100 fmol' }, { below: 10000, fmol: 50, label: 'Short (1–10 kb)', text: '35–50 fmol' }, { ng: 300, label: 'Long (>10 kb)', text: '300 ng' }] } },
          { id: 'ad-stop', text: 'Keep the library for loading.', stop: 'Store on ice or at 4 °C until you load it. Go on to the MinION/GridION loading SOP.' }
        ]
      }
    ]
  };
}

window.BENCH_PROTOCOLS = [
  nbd('24'),
  nbd('96')
  ,
  {
    id: 'sm01-ez12-dna',
    name: 'EZ1&2 DNA Extraction',
    short: 'SM01 EZ1&2',
    kit: 'EZ1&2 DNA Investigator Kit',
    vendor: 'QIAGEN · SOP FSD 75-GN-SM01',
    source: 'From the lab SOP FSD 75 - GN - SM01 (first issue, 30-12-2025) and the EZ1&2 DNA Investigator Kit Handbook.',
    choices: [
      { key: 'sampleType', label: 'Sample', question: 'What are you extracting from?', default: 'blood',
        options: [
          { value: 'blood', label: 'Liquid blood', short: '50 µL blood', detail: '50 µL blood + 190 µL G2 + 10 µL Proteinase K. Instrument protocol: Trace.', g2: '190', program: 'Trace', what: 'blood' },
          { value: 'fta', label: 'FTA card', short: 'card pieces', detail: 'Card pieces + 290 µL G2 + 10 µL Proteinase K. Instrument protocol: Tip Dance.', g2: '290', program: 'Tip Dance', what: 'FTA card pieces' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra reagent', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'ez-prep', title: 'Before you start', time: '~10 min',
        summary: 'Wear gloves, lab coat and a face mask. Heat the Thermomixer before you prepare the samples.',
        steps: [
          { id: 'ez-heat', text: 'Heat the <b>Thermomixer to 56 °C at 750 rpm</b> before preparing the samples.' },
          { id: 'ez-fta-bench', when: { sampleType: 'fta' }, text: 'Lay a <b>filter paper</b> on the bench guard and get a <b>sterile scalpel</b> ready.',
            warn: 'Use a new filter paper for every FTA card and a new scalpel for every sample.' },
          { id: 'ez-blood-thaw', when: { sampleType: 'blood' }, text: 'Thaw the blood samples and <b>invert to mix</b>.' }
        ]
      },
      {
        id: 'ez-lysis', title: 'Lysis', time: '1 h to overnight',
        summary: 'Sample + Buffer G2 + Proteinase K in an elution tube, then 56 °C in the Thermomixer.',
        steps: [
          { id: 'ez-fta-cut', when: { sampleType: 'fta' }, tube: { per: 'sample', suffix: 'LY1', what: 'lysis: FTA card pieces + G2 + Proteinase K', vessel: '1.5 mL elution tube (from the kit)' },
            text: 'Place the FTA card on the filter paper and cut about <b>a quarter of the blood spot</b>. Cut it into small pieces and put them in an elution tube with the tip of the scalpel.',
            warn: 'Keep your fingers on the white areas of the card, away from the blood. New scalpel for every sample.' },
          { id: 'ez-blood-add', when: { sampleType: 'blood' }, tube: { per: 'sample', suffix: 'LY1', what: 'lysis: 50 µL blood + G2 + Proteinase K', vessel: '1.5 mL elution tube (from the kit)' },
            text: 'Add <b>50 µL of blood</b> into an elution tube.' },
          { id: 'ez-g2', critical: true, text: 'Add <b>{sampleType.g2} µL of Buffer G2</b> to each elution tube.',
            calc: { type: 'mix', title: 'Lysis', noMaster: true,
              perTube: [{ name: 'Buffer G2', vol: { by: 'sampleType', blood: 190, fta: 290 } }, { name: 'Proteinase K (next step)', vol: 10 }],
              totals: [{ name: 'Buffer G2', vol: { by: 'sampleType', blood: 190, fta: 290 } }, { name: 'Proteinase K', vol: 10 }] },
            tip: 'G2 is 190 µL for liquid blood and 290 µL for FTA cards. Each tube ends up at 250 µL (blood) or 300 µL plus card pieces (FTA).' },
          { id: 'ez-pk', text: '<b>Vortex the Proteinase K for 10 s</b>, then add <b>10 µL</b> to each elution tube.' },
          { id: 'ez-incubate', text: 'Vortex each tube thoroughly and put it in the <b>Thermomixer at 56 °C, 750 rpm</b> for 1 hour (up to overnight).',
            timers: [{ min: 60, label: 'lysis 56 °C (minimum)' }],
            tip: 'One hour is the minimum. You can leave it overnight and carry on tomorrow.' },
          { id: 'ez-transfer', tube: { per: 'sample', suffix: 'LY2', what: 'lysate for the instrument', vessel: '2 mL sample tube (from the kit)' },
            text: 'Spin down the elution tube and transfer the lysate to a <b>2 mL sample tube</b>. Spin the sample tube.',
            tip: 'FTA cards: if you expect little DNA, you can transfer the card pieces too.' }
        ]
      },
      {
        id: 'ez-run', title: 'EZ1&2 run', time: '~20 min set-up',
        summary: 'One cartridge per sample. Well A: sample tube · Well C: tip holder + tip filter · Well D: new empty elution tube.',
        steps: [
          { id: 'ez-cartridge', text: 'For each sample, take a <b>cartridge</b>, invert it several times to mix the beads, and place it in the metal rack.',
            tip: 'Take the metal rack out of the instrument to insert the cartridge. It must sit in the grooves of the rack.' },
          { id: 'ez-wells', critical: true, tube: { per: 'sample', suffix: 'DNA', what: 'DNA extract (30 µL TE)', vessel: '1.5 mL elution tube (from the kit)', keep: true },
            text: 'Load each position: <b>Well A</b> the sample tube, <b>Well B</b> empty, <b>Well C</b> tip holder + tip filter, <b>Well D</b> a new empty elution tube.',
            warn: 'Take the caps off every tube in the instrument. The DNA ends up in the Well D tube: label it now.' },
          { id: 'ez-program', critical: true, text: 'On the instrument choose <b>DNA → DNA Investigator Kit → {sampleType.program}</b>, then <b>TE</b>, tip rack and <b>30 µL elution</b>. Choose the correct positions.',
            tip: 'Tip Dance is for FTA card pieces in the sample tube; Trace for everything else.' },
          { id: 'ez-start', text: 'Check that everything is in place, then start the run.' },
          { id: 'ez-collect', text: 'When the run finishes, cap the elution tubes (Well D) and take them out.' }
        ]
      },
      {
        id: 'ez-qc', title: 'QC & storage', time: '~15 min',
        summary: 'Qubit every extract (SOP SM09). TapeStation is optional (SOP SM10).',
        steps: [
          { id: 'ez-qubit', text: 'Measure each extract with <b>Qubit</b> (SOP SM09). Run a <b>TapeStation</b> (SOP SM10) if you want the size and DIN.',
            readings: [
              { key: 'qExtract', label: 'Extract Qubit', short: 'Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Extraction' },
              { key: 'tsExtract', label: 'Extract TapeStation peak size', short: 'Size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'Extraction', optional: true, chain: false },
              { key: 'dinExtract', label: 'Extract DIN', short: 'DIN', unit: 'DIN', per: 'sample', type: 'TapeStation', section: 'Extraction', optional: true, chain: false }
            ],
            calc: { type: 'yield', readingKey: 'qExtract', eluate: 30, note: 'Total DNA = Qubit × 30 µL elution volume (before taking any for QC).' } },
          { id: 'ez-store', text: 'Store the extracts.', stop: 'Same-day downstream work: 4 °C. Otherwise: freezer (−20 °C).' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm02-bone',
    name: 'Bone Sampling and Lysis',
    short: 'SM02 Bone',
    kit: 'Bone / tooth powder lysis',
    vendor: 'In-house · SOP FSD 75-GN-SM02',
    source: 'From the lab SOP FSD 75 - GN - SM02 (first issue, 30-12-2025); Pinhasi et al. 2015 and Mattiangeli et al. 2023 (bleach protocol).',
    choices: [
      { key: 'element', label: 'Element', question: 'What are you sampling?', default: 'petrous',
        options: [
          { value: 'petrous', label: 'Petrous bone', short: 'cochlea, Area C', detail: 'Remove the outer layer, then drill Area C (the cochlea) for powder.' },
          { value: 'tooth', label: 'Tooth', short: 'cementum, then dentin', detail: 'Drill the cementum first (priority), then the dentin.' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra reagent', unit: '%', value: 10 },
      { key: 'bleachStock', label: 'Sodium hypochlorite stock', unit: '%', value: 5, hint: 'the % on your stock bottle' }
    ],
    stages: [
      {
        id: 'bn-prep', title: 'Before you start', time: '~10 min',
        summary: 'Work in a clean area. Double gloves, lab coat and face mask.',
        steps: [
          { id: 'bn-ppe', text: 'Put on <b>double gloves</b>, a lab coat and a face mask, and work in the clean area.' },
          { id: 'bn-bleach', critical: true, text: 'Make fresh <b>0.5% sodium hypochlorite</b> by diluting the stock with molecular-grade water. You need it for the bone surface, the drill bits and 1 mL per powder sample.',
            calc: { type: 'dilute', title: '0.5% sodium hypochlorite', stockParam: 'bleachStock', target: 0.5, unit: '%', perSample: 1, diluent: 'molecular-grade water', what: 'sodium hypochlorite',
              note: 'Make extra on top for wiping the bones and drill bits.' } }
        ]
      },
      {
        id: 'bn-decon', title: 'Surface decontamination', time: '~45 min',
        summary: 'Bleach, ethanol, water, then UV 20 min per side. Drill bits: bleach, ethanol, UV 20 min.',
        steps: [
          { id: 'bn-wipe1', text: 'Wipe the bone fragment with <b>0.5% sodium hypochlorite</b>.' },
          { id: 'bn-wipe2', text: 'Wipe the bone fragment with <b>70% ethanol</b>.' },
          { id: 'bn-wipe3', text: 'Wipe the bone well with <b>distilled water</b> to remove any ethanol or bleach.' },
          { id: 'bn-uv', text: 'Put the bone under UV in the crosslinker: <b>20 min per side</b>.',
            timers: [{ min: 20, label: 'UV side 1' }, { min: 20, label: 'UV side 2' }] },
          { id: 'bn-bits', text: 'Decontaminate the drill bits: <b>0.5% bleach</b>, then <b>70% ethanol</b>, then <b>UV in the crosslinker for 20 min</b>.',
            timers: [{ min: 20, label: 'drill bits UV' }],
            tip: 'You can do the drill bits while the bone is under UV.' }
        ]
      },
      {
        id: 'bn-drill', title: 'Drilling & powder', time: '~30 min',
        summary: 'Aim for about 50 mg of powder in Tube A. Anything left over goes in Tube B.',
        steps: [
          { id: 'bn-foil', text: 'Wrap the decontaminated bone in <b>sterile aluminium foil</b>.' },
          { id: 'bn-mark', when: { element: 'petrous' }, text: 'Mark <b>Area C</b> (the cochlea) on the petrous bone. See Figure 1 in the SOP.' },
          { id: 'bn-outer', when: { element: 'petrous' }, text: 'With a sterile drill at <b>low speed</b> (under 5 RPM if possible, more only if needed), remove the <b>outer layer</b> of the bone into a weighing boat.' },
          { id: 'bn-powder', when: { element: 'petrous' }, critical: true, text: 'Using a <b>new weighing boat</b>, drill into the cleaned Area C to get bone powder.' },
          { id: 'bn-tooth', when: { element: 'tooth' }, critical: true, text: 'Drill the <b>cementum</b> first (priority), then the <b>dentin</b> if needed. See Figure 2 in the SOP.' },
          { id: 'bn-tubeA', critical: true, tube: { per: 'sample', suffix: 'A', what: 'Tube A: bone powder, then its lysate', vessel: 'sterile 1.5 mL tube' },
            text: 'Collect about <b>50 mg</b> of powder (if possible) into a sterile labelled 1.5 mL tube: <b>Tube A</b>.',
            reading: { key: 'powderMg', label: 'Powder in Tube A', short: 'Powder', unit: 'mg', per: 'sample', type: 'General', section: 'Bone sampling' } },
          { id: 'bn-tubeB', tube: { per: 'sample', suffix: 'B', what: 'remaining powder and bone chunks (Tube B)', vessel: 'sterile 1.5 mL tube', side: true, keep: true, from: 'start', store: 'keep it in case you need to sample again' },
            text: 'Put any remaining powder or bone chunks in a separate sterile labelled tube: <b>Tube B</b>.' }
        ]
      },
      {
        id: 'bn-pre', title: 'Pre-treatment', time: '~35 min',
        summary: 'Bleach the powder, two water washes, then an EDTA pre-wash that is kept as BEDTA. All spins: 1 min at maximum speed (~13,000 rpm).',
        steps: [
          { id: 'bn-hypo', critical: true, text: 'Add <b>1 mL of 0.5% sodium hypochlorite</b> to Tube A.' },
          { id: 'bn-hypo-inc', text: 'Vortex briefly and incubate in the thermoshaker at <b>24 °C, 750 rpm for 15 min</b>. Vortex briefly <b>every 5 min</b>, then put it back.',
            timers: [{ min: 5, label: '0–5 min, then vortex' }, { min: 5, label: '5–10 min, then vortex' }, { min: 5, label: '10–15 min' }] },
          { id: 'bn-hypo-spin', critical: true, text: 'Centrifuge at maximum speed (~13,000 rpm) for 1 min. <b>Remove and discard the supernatant</b>.',
            warn: 'The powder pellet is your sample: take the supernatant off slowly without touching it.' },
          { id: 'bn-wash1', text: 'Add <b>1 mL nuclease-free water</b>, vortex briefly, centrifuge 1 min at maximum speed, and discard the supernatant.' },
          { id: 'bn-wash2', text: 'Repeat the water wash: <b>1 mL</b>, vortex, centrifuge 1 min, discard the supernatant (two washes in total).' },
          { id: 'bn-edta', text: 'Add <b>500 µL of 0.5 M EDTA</b> to the pellet, vortex briefly to resuspend, and incubate at <b>37 °C for 5 min</b>.',
            timers: [{ min: 5, label: 'EDTA 37 °C' }],
            calc: { type: 'mix', title: 'EDTA pre-treatment', noMaster: true, perTube: [{ name: '0.5 M EDTA', vol: 500 }], totals: [{ name: '0.5 M EDTA (this step)', vol: 500 }, { name: '0.5 M EDTA (this step + lysis buffer)', vol: 1437 }] } },
          { id: 'bn-bedta', tube: { per: 'sample', suffix: 'BEDTA', what: 'EDTA pre-wash supernatant (BEDTA)', vessel: '1.5 mL tube', side: true, keep: true, store: 'store at −20 °C' },
            text: 'Centrifuge 1 min at maximum speed and collect the <b>supernatant</b> into a separate labelled tube: <b>BEDTA</b>. Store it at <b>−20 °C</b>.',
            tip: 'The pellet stays in Tube A and goes on to lysis.' }
        ]
      },
      {
        id: 'bn-lysis', title: 'Lysis', time: '2 h to overnight',
        summary: '1 mL lysis buffer per sample: 937 µL 0.5 M EDTA, 26 µL Proteinase K, 5 µL Tween-20, 32 µL water. 37 °C, 750 rpm.',
        steps: [
          { id: 'bn-lysis-mix', critical: true, text: 'Make the <b>lysis buffer</b>: 1 mL per sample.',
            calc: { type: 'mix', title: 'Lysis buffer',
              reagents: [{ name: '0.5 M EDTA', vol: 937 }, { name: 'Proteinase K (10 mg/mL)', vol: 26 }, { name: 'Tween-20', vol: 5 }, { name: 'Nuclease-free water', vol: 32 }] },
            tip: 'Tween-20 is viscous: pipette it slowly and check the tip is empty.' },
          { id: 'bn-lysis-add', text: 'Add <b>1 mL</b> of lysis buffer to the pellet in Tube A, vortex briefly, and <b>wrap the top of the tube with parafilm</b> to stop evaporation.' },
          { id: 'bn-lysis-inc', text: 'Incubate at <b>37 °C, 750 rpm</b> in the thermoshaker for <b>2 h to overnight (~16 h)</b>.',
            timers: [{ min: 120, label: 'lysis 37 °C (minimum)' }],
            tip: 'Two hours is the minimum; overnight is fine. Carry on with purification after it.' },
          { id: 'bn-next', text: 'Go on to purification with <b>silica columns</b> (see the purification SOP).',
            stop: 'The lysate in Tube A is ready for purification.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm03-ultra2',
    name: 'NEBNext Ultra II DNA Library Prep',
    short: 'SM03 Ultra II',
    kit: 'NEBNext Ultra II DNA (half volume)',
    vendor: 'NEB · SOP FSD 75-GN-SM03',
    source: 'From the lab SOP FSD 75 - GN - SM03 (first issue, 30-12-2025), with bead clean-ups from SOP SM11. Adaptor and PCR-cycle tables from the SOP.',
    barcodes: NEB_UDI_WELLS,
    barcodeLabel: 'Index well',
    maxSamples: 96,
    params: [
      { key: 'overage', label: 'Extra reagent', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'u2-prep', title: 'Before you start', time: '~30 min',
        summary: 'Pre-PCR room. Gloves, lab coat and face mask.',
        steps: [
          { id: 'u2-beads-rt', text: 'Take the <b>sample purification beads</b> out of the fridge so they reach room temperature (30 min).', timers: [{ min: 30, label: 'beads to room temp' }] },
          { id: 'u2-te', text: 'Make <b>0.1X TE</b> for the elutions: 1 part 1X TE + 9 parts ultra-pure water.',
            calc: { type: 'dilute', title: '0.1X TE', stock: 1, target: 0.1, unit: 'X', perSample: 0.053, diluent: 'ultra-pure water', what: 'TE', minMake: 1 } },
          { id: 'u2-qc', text: 'Enter the <b>Qubit</b> of each fragmented DNA sample. Leave "DNA µL" blank to use the full 25 µL, or type a smaller volume for concentrated samples.',
            readings: [
              { key: 'qFrag', label: 'Fragmented DNA Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Library prep' },
              { key: 'dnaVol', label: 'DNA µL used (blank = 25)', short: 'DNA µL', unit: 'µL', per: 'sample', optional: true, chain: false, noExport: true }
            ],
            calc: { type: 'input', title: 'End-prep input', readingKey: 'qFrag', volKey: 'dnaVol', maxVol: 25, maxNg: 1000,
              note: 'DNA + water to 25 µL. The input sets the adaptor dilution and the PCR cycles later on.' } }
        ]
      },
      {
        id: 'u2-ep', title: 'End prep (half volume)', time: '~70 min',
        summary: 'Pre-PCR room. 25 µL DNA + 3.5 µL buffer + 1.5 µL enzyme = 30 µL. 20 °C 30 min, 65 °C 30 min, lid ≥ 75 °C.',
        steps: [
          { id: 'u2-ep-thaw', text: 'Thaw on ice: <b>End Prep Reaction Buffer</b> (vortex before use) and <b>End Prep Enzyme Mix</b> (pipette mix before use).' },
          { id: 'u2-ep-mix', critical: true, tube: { per: 'sample', suffix: 'ER1', what: 'end prep, then adaptor ligation (same tube)', vessel: '0.2 mL PCR tube' },
            text: 'In a 0.2 mL PCR tube: <b>25 µL DNA</b> (made up with water as above), <b>3.5 µL End Prep Reaction Buffer</b> and <b>1.5 µL End Prep Enzyme Mix</b>.',
            calc: { type: 'mix', title: 'End prep',
              perTube: [{ name: 'DNA + water', vol: 25 }],
              reagents: [{ name: 'End Prep Reaction Buffer', vol: 3.5 }, { name: 'End Prep Enzyme Mix', vol: 1.5 }] } },
          { id: 'u2-ep-pm', text: 'Pipette mix 10–20 times, short vortex, then spin down. A few bubbles are fine.' },
          { id: 'u2-ep-inc', text: 'Run the end prep program, heated lid <b>≥ 75 °C</b>: <b>20 °C 30 min → 65 °C 30 min → 4 °C hold</b>.',
            timers: [{ min: 60, label: 'end prep program (20 °C → 65 °C)' }] }
        ]
      },
      {
        id: 'u2-lig', title: 'Adaptor ligation (half volume)', time: '~45 min',
        summary: 'Pre-PCR room. Adaptor first, then ligation master mix + enhancer. 20 °C 15 min (lid off), then USER 37 °C 15 min.',
        steps: [
          { id: 'u2-lig-thaw', text: 'Thaw on ice and pipette mix: <b>Ligation Master Mix</b>, <b>Ligation Enhancer</b> and <b>Adaptor for Illumina</b>.',
            tip: 'The Ligation Master Mix is very viscous: mix it well and pipette slowly.' },
          { id: 'u2-adaptor-dil', critical: true, text: 'Dilute the adaptor for each sample\'s input in <b>10 mM Tris-HCl (pH 7.5–8.0) with 10 mM NaCl</b>.',
            calc: { type: 'adaptor', perSample: 1.25, diluent: 'Tris-HCl/NaCl',
              bands: [{ above: 100, fold: 1, conc: '15 µM' }, { above: 4.999, fold: 10, conc: '1.5 µM' }, { above: 0.999, fold: 25, conc: '0.6 µM' }, { above: -1, fold: 50, conc: '0.3 µM' }],
              note: 'SOP table: 1 µg–101 ng no dilution · 100–5 ng 1:10 · under 5 ng 1:25 · under 1 ng 1:50 (as a double dilution).' } },
          { id: 'u2-lig-adaptor', critical: true, text: 'Add <b>1.25 µL of diluted adaptor</b> to each 30 µL end prep reaction and mix.',
            warn: 'Adaptor first. Do not mix the adaptor with the ligation master mix before it goes in.' },
          { id: 'u2-lig-mix', text: 'Add <b>15 µL Ligation Master Mix</b> and <b>0.5 µL Ligation Enhancer</b> (46.75 µL in total). Pipette mix 10–20 times, short vortex and spin.',
            calc: { type: 'mix', title: 'Ligation', perTube: [{ name: 'End prep + adaptor', vol: 31.25 }],
              reagents: [{ name: 'Ligation Master Mix', vol: 15 }, { name: 'Ligation Enhancer', vol: 0.5 }] } },
          { id: 'u2-lig-inc', critical: true, text: 'Incubate at <b>20 °C for 15 min with the heated lid OFF</b>.', timers: [{ min: 15, label: 'ligation 20 °C' }] },
          { id: 'u2-user', text: 'Add <b>1.5 µL USER Enzyme</b> (48.25 µL in total). Pipette mix 10–20 times, short vortex and spin.',
            calc: { type: 'mix', title: 'USER', noMaster: true, perTube: [{ name: 'USER Enzyme', vol: 1.5 }], totals: [{ name: 'USER Enzyme', vol: 1.5 }] } },
          { id: 'u2-user-inc', text: 'Incubate at <b>37 °C for 15 min</b>, heated lid <b>≥ 47 °C</b>.', timers: [{ min: 15, label: 'USER 37 °C' }] },
          { id: 'u2-lig-stop', text: 'Continue, or store the ligated DNA.', stop: 'Store at 4 °C for up to 24 hours.' }
        ]
      },
      {
        id: 'u2-c1', title: 'Clean-up 1× (pre-PCR)', time: '~30 min',
        summary: 'SOP SM11: 1× beads on the 48.25 µL ligation, elute in 18 µL 0.1X TE.',
        steps: beadCleanup({ id: 'u2-c1', ratio: 1, vol: 48.25, what: 'ligation reaction', tube: '0.2', elute: 18, buffer: '0.1X TE',
          out: { suffix: 'ALC', what: 'adaptor-ligated DNA, cleaned', keep: true, store: '7.5 µL goes into the PCR; store the rest at −20 °C' } })
          .concat([{ id: 'u2-c1-stop', text: 'Continue, or store the cleaned ligated DNA.', stop: '4 °C for a short time, −20 °C for longer.' }])
      },
      {
        id: 'u2-pcr', title: 'PCR enrichment', time: '~45 min',
        summary: 'Set up in the pre-PCR room, run in the post-PCR room. 7.5 µL DNA + 12.5 µL Q5 Master Mix + 5 µL index primers = 25 µL.',
        steps: [
          { id: 'u2-idx-thaw', text: 'Thaw and spin the <b>index plate</b> (NEBNext Multiplex Oligos, 96 Unique Dual Index Primer Pairs, 10 µM combined).' },
          { id: 'u2-idx-pick', critical: true, exportSection: 'Index PCR', text: 'Pick a valid index set (check it at <b>indexoligo.neb.com</b>) and note each sample\'s index well.',
            calc: { type: 'barcodes', title: 'Index map', note: 'The index for every sample is needed for the sample sheet. Change a well here or in samples.' } },
          { id: 'u2-idx-pierce', text: 'Pierce each chosen well with a <b>clean pipette tip</b>, then pipette mix each index 10 times.',
            warn: 'A new tip for every well and every index.' },
          { id: 'u2-pcr-mix', critical: true, tube: { per: 'sample', suffix: 'PC1', what: 'index PCR ({barcode})', vessel: '0.2 mL PCR tube' },
            text: 'In a new 0.2 mL PCR tube: <b>7.5 µL adaptor-ligated DNA</b>, <b>12.5 µL Q5 Master Mix</b> and <b>5 µL index primer mix</b>. Pipette mix 10–20 times and spin.',
            calc: { type: 'mix', title: 'Index PCR', perTube: [{ name: 'Adaptor-ligated DNA', vol: 7.5 }, { name: 'Index primer mix (its own well)', vol: 5 }],
              reagents: [{ name: 'NEBNext Ultra II Q5 Master Mix', vol: 12.5 }] },
            tip: 'Only 7.5 µL is used: put the rest of the cleaned ligated DNA (ALC tube) back at −20 °C.' },
          { id: 'u2-pcr-run', critical: true, text: 'Take the tubes to the <b>post-PCR room</b> thermal cycler: <b>98 °C 30 s</b> → <b>[98 °C 10 s, 65 °C 1 min 15 s] × cycles</b> → <b>65 °C 5 min</b> → 4 °C hold.',
            calc: { type: 'lookup', title: 'PCR cycles', column: 'Cycles',
              bands: [{ atLeast: 1000, text: '3–4' }, { atLeast: 500, text: '4–5' }, { atLeast: 100, text: '6–7' }, { atLeast: 50, text: '7–8' }, { atLeast: 10, text: '9–10' }, { atLeast: 5, text: '10–11' }, { atLeast: 1, text: '12–13' }, { atLeast: 0, text: '14–15' }],
              note: 'SOP table: cycles for ~1 µg (target enrichment library prep) by the input put into end prep. Samples needing different cycles need separate runs or blocks.' },
            readings: [{ key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'Index PCR', chain: false }] }
        ]
      },
      {
        id: 'u2-c2', title: 'PCR clean-up 1.2× (post-PCR)', time: '~30 min',
        summary: 'SOP SM11: 1.2× beads on the 25 µL PCR, elute in 35 µL 0.1X TE.',
        steps: beadCleanup({ id: 'u2-c2', ratio: 1.2, vol: 25, what: 'PCR reaction', tube: '0.2', elute: 35, buffer: '0.1X TE',
          out: { suffix: 'LIB', what: 'final library ({barcode})', keep: true } })
      },
      {
        id: 'u2-qc2', title: 'Library QC (post-PCR)', time: '~30 min',
        summary: 'Qubit (SOP SM09) and TapeStation (SOP SM10) for size and primer dimers.',
        steps: [
          { id: 'u2-lib-qc', text: 'Measure each library with <b>Qubit</b>, and run a <b>TapeStation</b> for the fragment size and any <b>primer dimers</b>.',
            readings: [
              { key: 'qLib', label: 'Library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'QC' },
              { key: 'tsLib', label: 'Library TapeStation peak size', short: 'Library size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC', chain: false }
            ],
            calc: { type: 'yield', readingKey: 'qLib', eluate: 35, note: 'Total library = Qubit × 35 µL.' },
            tip: 'A peak around 120–130 bp on the TapeStation is usually adaptor/primer dimer: note it if you see one.' },
          { id: 'u2-store', text: 'Store the libraries.', stop: '4 °C for a short time until loading, −20 °C for longer.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm05-exome-lib',
    name: 'Illumina Exome Library Prep',
    short: 'SM05 Exome lib',
    kit: 'Illumina DNA Prep with Exome 2.5 (pre-enrichment)',
    vendor: 'Illumina · SOP FSD 75-GN-SM05',
    source: 'From the lab SOP FSD 75 - GN - SM05 (30-12-2025). Continues in the Illumina 2.5 Exome Enrichment SOP (SM18).',
    barcodes: NEB_UDI_WELLS,
    barcodeLabel: 'Index well',
    maxSamples: 96,
    choices: [
      { key: 'input', label: 'Input', question: 'What is the input?', default: 'dna',
        options: [
          { value: 'dna', label: 'Extracted gDNA', short: 'Qubit sets the cycles', detail: 'Enter each Qubit: the input mass sets the PCR cycles (SOP table: under 10 ng 14–15 · 10–49 ng 12 · 20–1000 ng 9).' },
          { value: 'direct', label: 'Buccal or liquid blood', short: '9 cycles', detail: 'Buccal and liquid blood samples always get 9 PCR cycles.' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra reagent', unit: '%', value: 0, hint: 'the SOP master mixes already have extra (23 µL per sample, 20 µL used)' }
    ],
    stages: [
      {
        id: 'ex-prep', title: 'Before you start', time: '~30 min',
        summary: 'Pre- and post-PCR steps happen in separate rooms: get each room\'s reagents ready there.',
        steps: [
          { id: 'ex-rt', text: 'Bring <b>eBLT</b> and <b>TB1</b> to room temperature and vortex. Vortex the <b>TWB</b>.',
            warn: 'Do not use eBLT that has been stored below 2 °C.' },
          { id: 'ex-st2', text: 'Heat <b>ST2</b> to <b>37 °C for 10 min</b>, then vortex.', timers: [{ min: 10, label: 'ST2 at 37 °C' }] },
          { id: 'ex-epm', text: 'Thaw <b>EPM</b>, invert to mix, spin and put on ice. Thaw the <b>index plate</b>, spin and put on ice.' },
          { id: 'ex-ipb', text: 'Post-PCR room: bring <b>IPB</b> and <b>RSB</b> to room temperature (30 min) and vortex.', timers: [{ min: 30, label: 'IPB + RSB to room temp' }] }
        ]
      },
      {
        id: 'ex-tag', title: 'Tagment genomic DNA (pre-PCR only)', time: '~20 min',
        summary: 'Sample made up to 30 µL + 20 µL tagmentation mix = 50 µL. TAG program: 55 °C 5 min, hold 10 °C, lid 100 °C.',
        steps: [
          { id: 'ex-input', when: { input: 'dna' }, tube: { per: 'sample', suffix: 'TG1', what: 'tagmentation, then the index PCR (same tube or well)', vessel: 'PCR tube or plate well' },
            text: 'Add the sample to a PCR tube or plate well: <b>2–30 µL, typically 25 µL</b>, made up to 30 µL with NFW. Enter each Qubit; leave "DNA µL" blank for 25 µL.',
            readings: [
              { key: 'qIn', label: 'gDNA Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Library prep' },
              { key: 'dnaVol', label: 'DNA µL used (blank = 25)', short: 'DNA µL', unit: 'µL', per: 'sample', optional: true, chain: false, noExport: true }
            ],
            calc: { type: 'input', title: 'Tagmentation input', readingKey: 'qIn', volKey: 'dnaVol', defVol: 25, maxVol: 30, maxNg: 1000,
              note: 'DNA + NFW to 30 µL. The input mass sets the PCR cycles later on.' },
            tip: 'More than six samples: use a 96-well PCR plate (preferred) instead of single tubes.' },
          { id: 'ex-input-direct', when: { input: 'direct' }, tube: { per: 'sample', suffix: 'TG1', what: 'tagmentation, then the index PCR (same tube or well)', vessel: 'PCR tube or plate well' },
            text: 'Add the sample to a PCR tube or plate well: <b>2–30 µL, typically 25 µL</b>, made up to 30 µL with NFW.',
            reading: { key: 'qIn', label: 'Qubit (if measured)', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Library prep', optional: true },
            tip: 'More than six samples: use a 96-well PCR plate (preferred) instead of single tubes.' },
          { id: 'ex-tag-mm', critical: true, text: 'Make the <b>tagmentation master mix</b> in a 1.5 mL tube: eBLT (vortex it well) + TB1. Vortex and spin, then add <b>20 µL</b> to each sample.',
            calc: { type: 'mix', title: 'Tagmentation master mix', addVol: 20, perTube: [{ name: 'Sample + NFW', vol: 30 }],
              reagents: [{ name: 'eBLT', vol: 11.5 }, { name: 'TB1', vol: 11.5 }] } },
          { id: 'ex-tag-run', text: 'Pipette mix each sample 10× (or plate shaker 1600 rpm, 1 min). Close or seal, and run the <b>TAG program</b>: 55 °C 5 min → 10 °C hold, lid 100 °C.',
            timers: [{ min: 5, label: 'TAG 55 °C' }] }
        ]
      },
      {
        id: 'ex-ptc', title: 'Post-tagmentation clean-up (pre-PCR)', time: '~25 min',
        summary: 'Stop with ST2, then three TWB washes. Keep the last TWB on the beads until the PCR mix is ready.',
        steps: [
          { id: 'ex-ptc-rt', text: 'After the TAG program, leave the tubes at room temperature for 2 min.', timers: [{ min: 2, label: 'room temp' }] },
          { id: 'ex-st2-add', text: 'Add <b>10 µL ST2</b> to each sample. Pipette mix 10× (or shaker 1600 rpm, 1 min), close, and incubate at room temperature.',
            timers: [{ min: 5, label: 'ST2 stop' }],
            calc: { type: 'mix', title: 'ST2', noMaster: true, perTube: [{ name: 'ST2', vol: 10 }], totals: [{ name: 'ST2', vol: 10 }] } },
          { id: 'ex-ptc-mag', text: 'Place on the magnetic stand until clear (~3 min). <b>Remove and discard the supernatant (60 µL)</b>.' },
          { id: 'ex-twb1', critical: true, text: 'Off the magnet, <b>slowly</b> add <b>100 µL TWB</b> straight onto the beads (no foam). Slowly pipette mix (or shaker 1600 rpm, 1 min). On the magnet until clear (~3 min), then remove and discard the 100 µL.',
            calc: { type: 'wash', per: 'sample', perWash: 100, washes: 3, reagent: 'TWB' },
            tip: 'More than 48 samples: use a 96-well plate and work 1–2 columns at a time; remove the TWB with a multichannel and add the next 100 µL straight away.' },
          { id: 'ex-twb2', text: 'Second wash: <b>100 µL TWB</b>, mix slowly, magnet ~3 min, remove and discard.' },
          { id: 'ex-twb3', critical: true, text: 'Third wash: <b>100 µL TWB</b>, mix slowly, back on the magnet.',
            warn: 'Leave this last TWB on the beads and keep the tubes on the magnet until the PCR mix is ready.' }
        ]
      },
      {
        id: 'ex-pcr', title: 'Amplify tagmented DNA', time: '~45 min',
        summary: 'Set up in the pre-PCR room, run in the post-PCR room. 40 µL PCR mix + 5 µL index on the beads. eBLT program, lid 100 °C.',
        steps: [
          { id: 'ex-pcr-mm', text: 'Make the <b>PCR master mix</b>: EPM + NFW. Vortex, then spin at 280 × g for 10 s.',
            calc: { type: 'mix', title: 'PCR master mix', addVol: 40, perTube: [], reagents: [{ name: 'EPM', vol: 23 }, { name: 'NFW', vol: 23 }] } },
          { id: 'ex-pcr-twb', text: 'With the tubes still on the magnet, <b>remove and discard the TWB (100 µL)</b>. A little foam is fine.' },
          { id: 'ex-pcr-add', critical: true, text: 'Take off the magnet and <b>immediately</b> add <b>40 µL of PCR master mix</b> onto the beads. Pipette mix 10× (or shaker 1600 rpm, 1 min), close and spin at 280 × g for 10 s.',
            warn: 'Do not let the beads dry: add the mix straight after removing the TWB.' },
          { id: 'ex-idx-spin', text: 'Centrifuge the <b>index adapter plate</b> at 1000 × g for 1 min.' },
          { id: 'ex-idx-pick', critical: true, exportSection: 'Index PCR', text: 'Choose an index well for each sample and note it down. Pierce each chosen well\'s seal with a <b>new clean tip</b>, and pipette mix each index 5×.',
            calc: { type: 'barcodes', title: 'Index map', note: 'Every sample needs its own index: it goes on the sample sheet.' } },
          { id: 'ex-idx-add', text: 'Add <b>5 µL of index</b> to each sample, a new tip for every sample. Pipette mix 10× (or shaker 1600 rpm, 1 min) and spin at 280 × g for 30 s.',
            calc: { type: 'mix', title: 'Index', noMaster: true, perTube: [{ name: 'Index adapter (its own well)', vol: 5 }], totals: [] } },
          { id: 'ex-pcr-run', when: { input: 'dna' }, critical: true, text: 'Post-PCR room: run the <b>eBLT program</b>, lid 100 °C: 72 °C 3 min → 98 °C 3 min → <b>[98 °C 20 s, 60 °C 30 s, 72 °C 1 min] × cycles</b> → 72 °C 3 min → 10 °C hold.',
            calc: { type: 'lookup', title: 'PCR cycles', column: 'Cycles',
              bands: [{ atLeast: 50, text: '9' }, { atLeast: 20, text: '12 or 9 (rows overlap)' }, { atLeast: 10, text: '12' }, { atLeast: 0, text: '14–15' }],
              note: 'SOP table, as written: less than 10 ng 14–15 · 10–49 ng 12 · 20–1000 ng 9 · buccal / liquid blood 9. From 20 to 49 ng both rows apply, so both are shown. Samples needing different cycles need separate runs or blocks.' },
            readings: [{ key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'Index PCR', chain: false }] },
          { id: 'ex-pcr-run-direct', when: { input: 'direct' }, critical: true, text: 'Post-PCR room: run the <b>eBLT program</b> with <b>9 cycles</b>, lid 100 °C: 72 °C 3 min → 98 °C 3 min → [98 °C 20 s, 60 °C 30 s, 72 °C 1 min] × 9 → 72 °C 3 min → 10 °C hold.',
            reading: { key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'Index PCR', chain: false } },
          { id: 'ex-pcr-stop', text: 'Continue, or store the PCR products.', stop: '−25 °C to −15 °C for up to 30 days.' }
        ]
      },
      {
        id: 'ex-clean', title: 'Clean up libraries (post-PCR)', time: '~45 min',
        summary: 'Double-sided size selection with IPB: first the beads hold the large fragments (keep the supernatant), then the second round holds your library (keep the beads).',
        steps: [
          { id: 'ex-c-etoh', text: 'Make fresh <b>80% ethanol</b> for the washes.', calc: { type: 'wash', per: 'sample', perWash: 200, washes: 2, ethanol: 0.8 } },
          { id: 'ex-c-shake', text: 'If the samples were stored, thaw them at room temperature. Shake at <b>1800 rpm for 1 min</b>, then put on the magnet until clear (~1 min).' },
          { id: 'ex-c-sup', tube: { per: 'sample', suffix: 'SS1', what: 'PCR product, first size selection', vessel: 'MIDI plate well or 1.5 mL tube' },
            text: 'Transfer <b>45 µL of supernatant</b> to the matching well of a MIDI plate (or a new labelled tube).' },
          { id: 'ex-c-ipb1', critical: true, text: 'Vortex the IPB until even. Add <b>77 µL NFW</b> and <b>88 µL IPB</b> to each sample. Pipette mix 10× (or seal and shake 1800 rpm, 1 min) and incubate at room temperature.',
            timers: [{ min: 5, label: 'IPB first round' }],
            calc: { type: 'mix', title: 'Size selection', noMaster: true, perTube: [{ name: 'PCR supernatant', vol: 45 }, { name: 'NFW', vol: 77 }, { name: 'IPB', vol: 88 }],
              totals: [{ name: 'NFW', vol: 77 }, { name: 'IPB (88 µL now + 20 µL in the next tubes)', vol: 108 }] } },
          { id: 'ex-c-mag1', text: 'Place on the magnet until clear (~5 min).' },
          { id: 'ex-c-new', critical: true, tube: { per: 'sample', suffix: 'SS2', what: 'library, second size selection', vessel: 'MIDI plate well or 1.5 mL tube' },
            text: 'While it clears, add <b>20 µL of vortexed IPB</b> to the matching wells of a <b>new</b> MIDI plate (or new labelled tubes).' },
          { id: 'ex-c-transfer', critical: true, text: 'Without touching the beads, transfer <b>200 µL of supernatant</b> into the new wells with 20 µL IPB. Pipette mix 10× (or shake 1800 rpm, 1 min). Discard the old plate or tubes.',
            warn: 'This time KEEP the supernatant: your library is in it. The old beads hold fragments that are too large.' },
          { id: 'ex-c-bind', text: 'Incubate at room temperature, then put on the magnet until clear (~5 min). <b>Remove and discard all the supernatant</b>.',
            timers: [{ min: 5, label: 'IPB second round' }],
            warn: 'Now the library is on the beads: do not disturb them.' },
          { id: 'ex-c-wash1', text: 'Still on the magnet, slowly add <b>200 µL of fresh 80% ethanol</b> away from the beads. Wait 30 s, then remove and discard.', timers: [{ min: 0.5, label: 'ethanol wash' }] },
          { id: 'ex-c-wash2', text: 'Repeat: <b>200 µL 80% ethanol</b>, 30 s, remove.', timers: [{ min: 0.5, label: 'ethanol wash' }] },
          { id: 'ex-c-dry', critical: true, text: 'Remove any ethanol left, then air-dry for <b>5 min</b>.', timers: [{ min: 5, label: 'drying' }] },
          { id: 'ex-c-elute', text: 'Take off the magnet and add <b>18 µL RSB</b>. Seal or close, shake at <b>1800 rpm for 2 min</b>, then leave at room temperature for 2 min.',
            timers: [{ min: 2, label: 'elution' }] },
          { id: 'ex-c-collect', tube: { per: 'sample', suffix: 'LIB', what: 'pre-enriched library ({barcode})', vessel: 'PCR plate well or tube', keep: true },
            text: 'On the magnet until clear (~2 min), then transfer <b>15–17 µL</b> of supernatant to a new PCR plate.' },
          { id: 'ex-c-stop', text: 'Continue, or store the libraries.', stop: '−25 °C to −15 °C for up to 30 days.' }
        ]
      },
      {
        id: 'ex-qc', title: 'QC of pre-enriched libraries (post-PCR)', time: '~30 min',
        summary: 'Qubit (SOP SM09) and TapeStation (SOP SM10) for size and adaptor dimers.',
        steps: [
          { id: 'ex-lib-qc', text: 'Measure each library with <b>Qubit</b>, and run a <b>TapeStation</b> for the fragment size and adaptor dimers.',
            readings: [
              { key: 'qLib', label: 'Pre-enriched library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'QC' },
              { key: 'tsLib', label: 'Library TapeStation peak size', short: 'Library size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC', chain: false }
            ],
            calc: { type: 'yield', readingKey: 'qLib', eluate: 15, minNg: 100,
              note: 'Total = Qubit × 15 µL (the least you transfer). For the enrichment pool: 250–500 ng per library is recommended; minimum 100 ng (10–49 ng inputs) or 250 ng (50–1000 ng, saliva and blood).' } },
          { id: 'ex-next', text: 'Carry on with the <b>Illumina 2.5 Exome Enrichment</b> SOP.', stop: 'Store the pre-enriched libraries at −25 °C to −15 °C (up to 30 days).' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm06-lsk114',
    name: 'ONT Ligation Sequencing',
    short: 'SM06 LSK114',
    kit: 'SQK-LSK114',
    vendor: 'Oxford Nanopore · SOP FSD 75-GN-SM06',
    source: 'From the lab SOP FSD 75 - GN - SM06 (30-12-2025). Flow cell loading is in the MinION Loading SOP (SM14).',
    choices: [
      { key: 'sizeGoal', label: 'Keeping', question: 'Which fragments do you want to keep?', default: 'long',
        options: [
          { value: 'long', label: 'Fragments over 3 kb', short: 'LFB · 0.4× beads', detail: 'Long Fragment Buffer removes fragments under 3 kb. 0.4× beads (20 µL) after ligation.',
            buffer: 'Long Fragment Buffer (LFB)', short2: 'LFB', ratioText: '0.4×' },
          { value: 'all', label: 'All fragment sizes', short: 'SFB · 1.2× beads', detail: 'Short Fragment Buffer keeps all fragment sizes. 1.2× beads (60 µL) after ligation.',
            buffer: 'Short Fragment Buffer (SFB)', short2: 'SFB', ratioText: '1.2×' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra reagent', unit: '%', value: 10 },
      { key: 'targetFmol', label: 'fmol into end-prep', unit: 'fmol', value: 200, hint: 'SOP: 100–200 fmol; samples with less use the whole 24 µL' },
      { key: 'fragLen', label: 'Default fragment length', unit: 'bp', value: 8000, hint: 'used when there is no TapeStation size' }
    ],
    stages: [
      {
        id: 'lk-prep', title: 'Before you start', time: '~15 min',
        summary: 'Quantify the DNA, and dilute anything over 200 fmol down to 100–200 fmol in 24 µL.',
        steps: [
          { id: 'lk-qc', text: 'Enter each sample\'s <b>Qubit</b>, and its <b>TapeStation</b> peak size if you have it (it makes the fmol exact).',
            readings: [
              { key: 'qIn', label: 'Input Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Library prep' },
              { key: 'tsIn', label: 'Input TapeStation peak size', short: 'Input size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'Library prep', optional: true, chain: false }
            ] },
          { id: 'lk-thaw', text: 'Thaw, mix by inverting, spin and put on ice: <b>NEBNext FFPE DNA Repair Buffer</b>, <b>FFPE DNA Repair Mix</b>, <b>Ultra II End-prep Reaction Buffer</b> and <b>Ultra II End-prep Enzyme Mix</b>.',
            tip: 'The two buffers may show a precipitate: pipette mix and vortex 30 s to dissolve it. Do not vortex the enzyme mixes. A yellow FFPE buffer is fine to use.',
            calc: { type: 'mix', title: 'Repair & end-prep', noMaster: true,
              perTube: [{ name: 'DNA (+ NFW)', vol: 24 }, { name: 'FFPE DNA Repair Buffer', vol: 1.75 }, { name: 'FFPE DNA Repair Mix', vol: 1 }, { name: 'End-prep Reaction Buffer', vol: 1.75 }, { name: 'End-prep Enzyme Mix', vol: 1.5 }],
              totals: [{ name: 'FFPE DNA Repair Buffer', vol: 1.75 }, { name: 'FFPE DNA Repair Mix', vol: 1 }, { name: 'End-prep Reaction Buffer', vol: 1.75 }, { name: 'End-prep Enzyme Mix', vol: 1.5 }] } }
        ]
      },
      {
        id: 'lk-ep', title: 'DNA repair & end-prep', time: '~45 min',
        summary: '24 µL DNA + 1.75 + 1 + 1.75 + 1.5 µL = 30 µL. 20 °C 5 min, 65 °C 5 min. Then a 1× bead clean-up into 32 µL water.',
        steps: [
          { id: 'lk-ep-mix', critical: true, tube: { per: 'sample', suffix: 'ER1', what: 'repair & end-prep reaction', vessel: 'PCR tube' },
            text: 'In a PCR tube, add in this order, pipetting between each addition: <b>24 µL DNA</b> (diluted as below), <b>1.75 µL FFPE Repair Buffer</b>, <b>1 µL FFPE Repair Mix</b>, <b>1.75 µL End-prep Reaction Buffer</b>, <b>1.5 µL End-prep Enzyme Mix</b>. Mix by pipetting and spin.',
            calc: { type: 'fmolNorm', title: 'DNA for end-prep', readingKey: 'qIn', lengthKey: 'tsIn', fmolParam: 'targetFmol', lenParam: 'fragLen', finalVol: 24, minFmol: 100, diluent: 'NFW' } },
          { id: 'lk-ep-inc', text: 'Run the thermal cycler: <b>20 °C 5 min → 65 °C 5 min</b>.', timers: [{ min: 10, label: 'end-prep program (20 °C → 65 °C)' }] },
          { id: 'lk-ep-etoh', text: 'While it runs: vortex the <b>purification beads</b>, make fresh <b>80% ethanol</b>, and get the magnet and two new Eppendorf tubes per sample ready.',
            calc: { type: 'wash', per: 'sample', perWash: 400, washes: 2, ethanol: 0.8 } },
          { id: 'lk-ep-transfer', tube: { per: 'sample', suffix: 'ER2', what: 'end-prep reaction for the bead clean-up', vessel: '1.5 mL Eppendorf tube' },
            text: 'Transfer the <b>30 µL</b> reaction to a new Eppendorf tube.' },
          { id: 'lk-ep-beads', critical: true, text: 'Add <b>30 µL beads (1×)</b> and mix by flicking.',
            calc: { type: 'beads', ratio: 1, volume: 30, per: 'sample', what: 'end-prep reaction', beadName: 'purification beads' } },
          { id: 'lk-ep-hula', text: 'Hula mix at room temperature.', timers: [{ min: 5, label: 'Hula mixer' }] },
          { id: 'lk-ep-pellet', text: 'Spin and place on the magnet until clear. <b>Remove and discard the supernatant</b>.' },
          { id: 'lk-ep-wash', text: 'Keep on the magnet: add <b>400 µL of 80% ethanol</b>, wait 30 s, remove and discard. <b>Do this twice.</b>', timers: [{ min: 0.5, label: 'wash 1' }, { min: 0.5, label: 'wash 2' }] },
          { id: 'lk-ep-dry', critical: true, text: 'Spin, pipette off the last ethanol, and air-dry about <b>30 s</b>.', timers: [{ min: 0.5, label: 'drying' }],
            warn: 'Do not dry until the pellet cracks.' },
          { id: 'lk-ep-elute', text: 'Off the magnet: elute in <b>32 µL nuclease-free water</b> and incubate at room temperature.', timers: [{ min: 2, label: 'elution' }],
            tip: 'The extra 2 µL is on purpose: it covers the last bit you can\'t take without beads.' },
          { id: 'lk-ep-collect', tube: { per: 'sample', suffix: 'ERC', what: 'end-prepped DNA, cleaned; the adapter ligation is done in this tube', vessel: '1.5 mL Eppendorf tube' },
            text: 'On the magnet until clear, then transfer <b>30 µL</b> to a new Eppendorf tube.' },
          { id: 'lk-ep-qc', text: 'Measure <b>1 µL</b> with Qubit (SOP SM09).',
            reading: { key: 'qEP', label: 'End-prep Qubit', short: 'End-prep Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'End-prep clean-up' },
            calc: { type: 'yield', readingKey: 'qEP', eluate: 30, note: 'Total = Qubit × 30 µL.' } }
        ]
      },
      {
        id: 'lk-lig', title: 'Adapter ligation & clean-up', time: '~50 min',
        summary: '30 µL DNA + 12.5 µL LNB + 5 µL Quick T4 Ligase + 2.5 µL LA = 50 µL. {sizeGoal.ratioText} beads, two {sizeGoal.short2} washes, elute in 15 µL EB.',
        steps: [
          { id: 'lk-lig-thaw', text: 'Spin the <b>Ligation Adapter (LA)</b> and <b>Quick T4 Ligase</b> and put on ice. Thaw the <b>Ligation Buffer (LNB)</b>, mix by pipetting, spin and put on ice. Thaw, vortex and spin the <b>Elution Buffer (EB)</b> and the <b>{sizeGoal.buffer}</b>.',
            tip: '{sizeGoal.short2} for this run: SFB keeps all fragment sizes, LFB removes fragments under 3 kb. Keep everything on ice after thawing.' },
          { id: 'lk-lig-mix', critical: true, text: 'Add to the tube with your 30 µL DNA, mixing 10–20 times by pipetting after each addition: <b>12.5 µL LNB</b>, <b>5 µL Quick T4 DNA Ligase</b>, <b>2.5 µL LA</b>. Pipette mix again and spin briefly.',
            calc: { type: 'mix', title: 'Adapter ligation', noMaster: true,
              perTube: [{ name: 'DNA', vol: 30 }, { name: 'LNB', vol: 12.5 }, { name: 'Quick T4 DNA Ligase', vol: 5 }, { name: 'LA', vol: 2.5 }],
              totals: [{ name: 'LNB', vol: 12.5 }, { name: 'Quick T4 DNA Ligase', vol: 5 }, { name: 'LA', vol: 2.5 }] },
            tip: 'LNB is viscous: pipette slowly and mix well.' },
          { id: 'lk-lig-inc', text: 'Incubate at room temperature. Vortex the beads meanwhile.', timers: [{ min: 10, label: 'ligation' }] },
          { id: 'lk-lig-beads', critical: true, text: 'Add <b>{sizeGoal.ratioText} beads</b> to the ligation and mix by flicking.',
            calc: { type: 'beads', ratio: { by: 'sizeGoal', long: 0.4, all: 1.2 }, volume: 50, per: 'sample', what: 'ligation', beadName: 'purification beads',
              why: 'SOP: 0.4× (20 µL) by default; 1.2× (60 µL) to keep all fragments.' } },
          { id: 'lk-lig-hula', text: 'Hula mix at room temperature.', timers: [{ min: 5, label: 'Hula mixer' }] },
          { id: 'lk-lig-pellet', text: 'Spin, place on the magnet until clear, and <b>remove and discard the supernatant</b>.' },
          { id: 'lk-lig-wash1', critical: true, text: 'Off the magnet: add <b>250 µL {sizeGoal.short2}</b> and flick to mix. Spin, back on the magnet until clear, then remove and discard.',
            calc: { type: 'wash', per: 'sample', perWash: 250, washes: 2, reagent: '{sizeGoal.buffer}' },
            warn: 'Wash with {sizeGoal.short2}, not ethanol: ethanol would strip the adapters.' },
          { id: 'lk-lig-wash2', text: 'Repeat the wash: <b>250 µL {sizeGoal.short2}</b>, flick, spin, magnet, remove.' },
          { id: 'lk-lig-dry', critical: true, text: 'Spin, back on the magnet, remove what is left of the buffer, and air-dry about <b>30 s</b>.', timers: [{ min: 0.5, label: 'drying' }],
            warn: 'Do not over-dry or crack the pellet.' },
          { id: 'lk-lig-elute', text: 'Off the magnet: add <b>15 µL Elution Buffer (EB)</b>, flick to mix, spin, and incubate <b>10 min</b> at room temperature.',
            timers: [{ min: 10, label: 'elution' }],
            tip: 'High molecular weight DNA (long, intact): incubate at 37 °C for the 10 min instead, to get more of the long fragments back.' },
          { id: 'lk-lig-collect', tube: { per: 'sample', suffix: 'LIB', what: 'final library (adapter-ligated)', vessel: '1.5 mL Eppendorf tube', keep: true },
            text: 'On the magnet until clear (~1 min), then transfer the <b>15 µL</b> library to a new tube.' }
        ]
      },
      {
        id: 'lk-qc', title: 'Library QC', time: '~30 min',
        summary: 'Qubit (SOP SM09) and TapeStation (SOP SM10). Load with the MinION Loading SOP (SM14).',
        steps: [
          { id: 'lk-lib-qc', text: 'Measure each library with <b>Qubit</b> and run a <b>TapeStation</b>.',
            readings: [
              { key: 'qLib', label: 'Library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'QC' },
              { key: 'tsLib', label: 'Library TapeStation peak size', short: 'Library size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC', optional: true, chain: false }
            ],
            calc: { type: 'yield', readingKey: 'qLib', eluate: 15, note: 'Total = Qubit × 15 µL.' } },
          { id: 'lk-next', text: 'Go on to flow cell loading (<b>MinION Loading SOP</b>, SM14).' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm08-16s',
    name: '16S Amplification',
    short: 'SM08 16S PCR',
    kit: 'LongAmp Taq 2X · 27F / 1492R',
    vendor: 'NEB · SOP FSD 75-GN-SM08',
    source: 'From the lab SOP FSD 75 - GN - SM08 (30-12-2025) and the NEB LongAmp Taq 2X Master Mix protocol. Full-length 16S rRNA gene, ~1.5 kb.',
    params: [
      { key: 'overage', label: 'Extra master mix', unit: '%', value: 10, hint: 'the SOP table is exact (4 reactions = 4 × 14.5 µL); set 0 to match it' }
    ],
    stages: [
      {
        id: 's16-prep', title: 'Before you start', time: '~10 min',
        summary: 'Pre-PCR room, under the PCR workstation. Gloves, lab coat and face mask.',
        steps: [
          { id: 's16-ws', text: 'Work under the <b>PCR workstation</b> in the pre-PCR room. Put a <b>cold block</b> out.' },
          { id: 's16-thaw', text: 'Thaw the <b>LongAmp Taq 2X Master Mix</b>, <b>27F primer (10 µM)</b> and <b>1492R primer (10 µM)</b>, and keep them on the cold block.' }
        ]
      },
      {
        id: 's16-mm', title: 'Master mix', time: '~10 min',
        summary: '14.5 µL per reaction: 12.5 µL LongAmp Taq 2X + 1 µL 27F + 1 µL 1492R.',
        steps: [
          { id: 's16-mm-make', critical: true, text: 'Label a 1.5 or 2 mL Eppendorf tube <b>Master Mix</b>. Add, in this order: <b>LongAmp Taq 2X Master Mix</b>, <b>27F primer</b>, <b>1492R primer</b>.',
            calc: { type: 'mix', title: '16S master mix', perTube: [{ name: 'gDNA + water', vol: 10.5 }],
              reagents: [{ name: 'LongAmp Taq 2X Master Mix', vol: 12.5 }, { name: '27F primer (10 µM)', vol: 1 }, { name: '1492R primer (10 µM)', vol: 1 }] } },
          { id: 's16-mm-mix', text: 'Mix gently by pipetting at least 10 times. Spin down briefly and keep on the cold block.' }
        ]
      },
      {
        id: 's16-rxn', title: 'Reaction set-up', time: '~15 min',
        summary: '14.5 µL master mix + 1–10.5 µL gDNA, made up to 10.5 µL with water = 25 µL.',
        steps: [
          { id: 's16-dna', text: 'Enter how much <b>gDNA</b> each sample gets (1–10.5 µL; blank = 10.5 µL). The Qubit is optional: with it you also see the ng going in.',
            readings: [
              { key: 'dnaVol', label: 'gDNA µL (blank = 10.5)', short: 'DNA µL', unit: 'µL', per: 'sample', optional: true, chain: false, noExport: true },
              { key: 'qIn', label: 'gDNA Qubit (if measured)', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'PCR', optional: true }
            ],
            calc: { type: 'input', title: 'DNA in each reaction', readingKey: 'qIn', volKey: 'dnaVol', maxVol: 10.5, minVol: 1, qOptional: true,
              note: 'gDNA + nuclease-free water to 10.5 µL.' } },
          { id: 's16-tubes', critical: true, tube: { per: 'sample', suffix: 'PC1', what: '16S PCR (27F / 1492R)', vessel: '0.2 mL thin-walled PCR tube', keep: true },
            text: 'Label the 0.2 mL PCR tubes and add <b>14.5 µL of master mix</b> to each.' },
          { id: 's16-add', text: 'Add the <b>gDNA</b> and <b>nuclease-free water</b> to each tube (10.5 µL in total, 25 µL per reaction). Mix gently by pipetting and spin down briefly.' }
        ]
      },
      {
        id: 's16-pcr', title: 'Thermal cycling', time: '~1.5 h',
        summary: '94 °C 30 s → [94 °C 10 s, 52 °C 30 s, 65 °C 90 s] × 20–35 → 65 °C 10 min → 4 °C hold.',
        steps: [
          { id: 's16-run', critical: true, text: 'Run the 16S program: <b>94 °C 30 s</b> → <b>[94 °C 10 s, 52 °C 30 s, 65 °C 90 s] × 20–35 cycles</b> → <b>65 °C 10 min</b> → 4 °C hold.',
            tip: 'Cycles depend on the purity and concentration of the DNA: around 20 for high-quality purified samples, more for samples with little DNA.',
            reading: { key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'PCR', chain: false } },
          { id: 's16-done', text: 'When the program finishes, take the tubes out. The ~1.5 kb 16S amplicons are ready for the next step.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm09-qubit-hs',
    name: 'Qubit 1X dsDNA HS',
    short: 'SM09 Qubit',
    kit: 'Qubit 1X dsDNA HS Assay Kit',
    vendor: 'Thermo Fisher · SOP FSD 75-GN-SM09',
    source: 'From the lab SOP FSD 75 - GN - SM09 (30-12-2025) and the Qubit 1X dsDNA HS Assay Kits User Guide.',
    choices: [
      { key: 'standards', label: 'Standards', question: 'When were the standards last run on the Qubit?', default: 'new',
        options: [
          { value: 'new', label: 'Over a week ago (or not sure)', short: 'make new standards', detail: 'Make Standard #1 and #2 and calibrate the Qubit before measuring.' },
          { value: 'recent', label: 'Within the last week', short: 'use the calibration', detail: 'Skip the standards and measure with the existing calibration.' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra buffer', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'qb-std', title: 'Standards', time: '~5 min',
        summary: 'Check on the Qubit when the standards were last run. Over a week ago: make new ones.',
        steps: [
          { id: 'qb-std-check', text: 'Check on the Qubit when the <b>standards were last run</b>. If it was over a week ago, make new standards (setup answer: {standards.short}).' },
          { id: 'qb-std-make', when: { standards: 'new' }, critical: true, text: 'Label two Qubit assay tubes <b>Standard #1</b> and <b>Standard #2</b>. Add <b>190 µL of Qubit 1X dsDNA HS buffer</b> to each, then <b>10 µL of Standard #1</b> to the first tube and <b>10 µL of Standard #2</b> to the second.',
            calc: { type: 'mix', title: 'Each standard tube', noMaster: true, perTube: [{ name: 'Qubit 1X dsDNA HS buffer', vol: 190 }, { name: 'Standard #1 or #2', vol: 10 }], totals: [] } },
          { id: 'qb-std-mix', when: { standards: 'new' }, text: 'Cap the tubes, vortex 2–3 s, and spin down briefly.' }
        ]
      },
      {
        id: 'qb-samples', title: 'Samples', time: '~10 min',
        summary: '199 µL buffer + 1 µL sample per tube. Label the cap only.',
        steps: [
          { id: 'qb-label', critical: true, tube: { per: 'sample', suffix: 'QB', what: 'Qubit assay tube (discard after reading)', vessel: 'Qubit assay tube', side: true, from: 'start', capOnly: true },
            text: 'Label the <b>cap</b> of a Qubit assay tube for each sample.',
            warn: 'Do not write on the side of the tube: it affects the reading.' },
          { id: 'qb-buffer', text: 'Add <b>199 µL of Qubit 1X dsDNA HS buffer</b> to each sample tube.',
            calc: { type: 'mix', title: 'Buffer', noMaster: true, perTube: [{ name: 'Qubit 1X dsDNA HS buffer', vol: 199 }, { name: 'DNA sample (next step)', vol: 1 }],
              totals: [{ name: 'Buffer for the sample tubes', vol: 199 }] },
            tip: 'New standards need another 2 × 190 µL = 380 µL of buffer.' },
          { id: 'qb-dna', critical: true, text: 'Add <b>1 µL of each DNA sample</b> to its tube.' },
          { id: 'qb-mix', text: 'Cap the tubes, vortex 2–3 s, and spin down briefly.' },
          { id: 'qb-inc', text: 'Incubate all tubes (standards and samples) at room temperature <b>in the dark</b>.', timers: [{ min: 2, label: 'in the dark' }] }
        ]
      },
      {
        id: 'qb-measure', title: 'Measure', time: '~10 min',
        summary: 'dsDNA HS 1X assay, units ng/µL, sample volume 1 µL.',
        steps: [
          { id: 'qb-cal', when: { standards: 'new' }, critical: true, text: 'Select <b>"dsDNA HS 1X Assay"</b>, insert the two standards and <b>calibrate</b> the Qubit.' },
          { id: 'qb-assay', when: { standards: 'recent' }, text: 'Select <b>"dsDNA HS 1X Assay"</b> on the Qubit and use the existing calibration.' },
          { id: 'qb-units', critical: true, text: 'Set units to <b>ng/µL</b> and the sample volume to <b>1 µL</b>.' },
          { id: 'qb-read', text: 'Measure each sample tube on its own and <b>record the concentration</b> shown.',
            reading: { key: 'qubit', label: 'Qubit 1X dsDNA HS', short: 'Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Quantification' } },
          { id: 'qb-discard', text: 'Discard the standards and assay tubes after the run.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm10-tapestation',
    name: 'TapeStation ScreenTape',
    short: 'SM10 TapeStation',
    kit: 'Genomic DNA / HS D1000 ScreenTape',
    vendor: 'Agilent TapeStation 4150 · SOP FSD 75-GN-SM10',
    source: 'From the lab SOP FSD 75 - GN - SM10 (30-12-2025) and the Agilent Genomic / HS D1000 ScreenTape quick guides.',
    choices: [
      { key: 'assay', label: 'Assay', question: 'Which ScreenTape assay?', default: 'genomic',
        options: [
          { value: 'genomic', label: 'Genomic DNA', short: '1 µL + 10 µL buffer', detail: 'For gDNA and extracts: peak size and DIN. 1 µL sample + 10 µL Genomic DNA Sample Buffer.',
            buffer: 'Genomic DNA Sample Buffer', bufVol: '10', ladder: 'Genomic DNA Ladder', tape: 'Genomic DNA ScreenTape' },
          { value: 'hsd1000', label: 'High Sensitivity D1000', short: '1 µL + 1 µL buffer', detail: 'For libraries and amplicons: fragment size and dimers. 1 µL sample + 1 µL HS D1000 Sample Buffer.',
            buffer: 'HS D1000 Sample Buffer', bufVol: '1', ladder: 'HS D1000 Ladder', tape: 'HS D1000 ScreenTape' }
        ] },
      { key: 'ladder', label: 'Ladder', question: 'Physical ladder or electronic ladder?', default: 'physical',
        options: [
          { value: 'physical', label: 'Physical ladder', short: 'ladder tube', detail: 'Prepare a ladder tube like a sample; it takes one lane.', tubes: 'sample and ladder' },
          { value: 'electronic', label: 'Electronic ladder', short: 'no ladder tube', detail: 'No ladder tube: leave its position empty and add the electronic ladder in the software.', tubes: 'sample' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra sample buffer', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'ts-prep', title: 'Before you start', time: '~30 min',
        summary: 'Reagents to room temperature for 30 min. Check the tips and empty the waste before the run.',
        steps: [
          { id: 'ts-rt', text: 'Bring the <b>{assay.buffer}</b>, <b>{assay.ladder}</b> and <b>{assay.tape}</b> to room temperature.', timers: [{ min: 30, label: 'reagents to room temp' }] },
          { id: 'ts-on', text: 'Turn on the <b>TapeStation</b>.' },
          { id: 'ts-tape', critical: true, text: 'Flick the <b>{assay.tape}</b> a few times and place it in the ScreenTape nest. Make sure it has <b>enough unused lanes</b> for your run.',
            calc: { type: 'count', title: 'Lanes needed', unit: 'lanes', extra: { by: 'ladder', physical: 1, electronic: 0 }, extraLabel: 'ladder', per: 16, perLabel: 'lane ScreenTape',
              note: 'Use a second ScreenTape if this one has fewer unused lanes.' } },
          { id: 'ts-tips', critical: true, text: 'Check there are <b>enough tips</b> in the instrument\'s tip rack, and <b>empty the waste container</b>.' }
        ]
      },
      {
        id: 'ts-samples', title: 'Sample preparation', time: '~10 min',
        summary: 'Per tube: 1 µL sample (or ladder) + {assay.bufVol} µL {assay.buffer}.',
        steps: [
          { id: 'ts-label', tube: { per: 'sample', suffix: 'TS', what: 'TapeStation tube (discard after the run)', vessel: '0.2 mL PCR tube', side: true, from: 'start', noCap: true },
            text: 'Label a 0.2 mL PCR tube for each sample.' },
          { id: 'ts-mix', critical: true, text: 'Add <b>{assay.bufVol} µL {assay.buffer}</b> and <b>1 µL sample</b> to each tube.',
            calc: { type: 'mix', title: 'Each sample tube', noMaster: true,
              perTube: [{ name: 'Sample', vol: 1 }, { name: '{assay.buffer}', vol: { by: 'assay', genomic: 10, hsd1000: 1 } }],
              totals: [{ name: '{assay.buffer} for the samples', vol: { by: 'assay', genomic: 10, hsd1000: 1 } }] } },
          { id: 'ts-ladder', when: { ladder: 'physical' }, text: 'Ladder tube: <b>1 µL {assay.ladder}</b> + <b>{assay.bufVol} µL {assay.buffer}</b>.' },
          { id: 'ts-vortex', text: 'Vortex the tubes for <b>1 min</b>, then spin down briefly.', timers: [{ min: 1, label: 'vortex' }] },
          { id: 'ts-caps', text: 'Remove the PCR tube caps (use scissors if needed).' }
        ]
      },
      {
        id: 'ts-run', title: 'Run', time: '~1–2 h',
        summary: 'Note every tube position in the TapeStation software.',
        steps: [
          { id: 'ts-load', critical: true, text: 'Put the {ladder.tubes} tubes in the TapeStation and <b>note their positions in the software</b>.',
            tip: 'Electronic ladder: leave the space where the ladder tube would go, right-click it in the software and add the electronic ladder.' },
          { id: 'ts-start', text: 'Check everything once more, then <b>start the run</b> and make sure it has started.' },
          { id: 'ts-genomic', when: { assay: 'genomic' }, text: 'When the run finishes, record each sample\'s <b>peak size</b> and <b>DIN</b>.',
            readings: [
              { key: 'tsPeak', label: 'Peak size', short: 'Peak size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC' },
              { key: 'tsDIN', label: 'DIN', short: 'DIN', unit: 'DIN', per: 'sample', type: 'TapeStation', section: 'QC', chain: false }
            ] },
          { id: 'ts-hs', when: { assay: 'hsd1000' }, text: 'When the run finishes, record each sample\'s <b>peak size</b>. Note any adapter or primer dimer peak.',
            reading: { key: 'tsPeak', label: 'Peak size', short: 'Peak size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC' } }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm11-beads',
    name: 'Reaction Bead Cleanup',
    short: 'SM11 Bead clean-up',
    kit: 'SPRIselect / AMPure XP / NEBNext beads',
    vendor: 'In-house · SOP FSD 75-GN-SM11',
    source: 'From the lab SOP FSD 75 - GN - SM11 (30-12-2025). The same steps are built into the library prep SOPs that refer to it.',
    choices: [
      { key: 'beads', label: 'Beads', question: 'Which beads?', default: 'ampure',
        options: [
          { value: 'ampure', label: 'AMPure XP', short: '', detail: '', name: 'AMPure XP beads' },
          { value: 'spri', label: 'SPRIselect', short: '', detail: '', name: 'SPRIselect beads' },
          { value: 'neb', label: 'NEBNext Sample Purification Beads', short: '', detail: '', name: 'NEBNext Sample Purification Beads' }
        ] },
      { key: 'tube', label: 'Tube', question: 'What are the samples in?', default: 't02',
        options: [
          { value: 't02', label: '0.2 mL tubes', short: '190 µL ethanol washes', detail: '0.2 mL magnetic stand; 190 µL of 80% ethanol per wash.', size: '0.2 mL', wash: '190' },
          { value: 't15', label: '1.5 mL tubes', short: '400 µL ethanol washes', detail: '1.5 mL magnetic stand; 400 µL of 80% ethanol per wash.', size: '1.5 mL', wash: '400' }
        ] },
      { key: 'elBuf', label: 'Elution', question: 'What do you elute in?', default: 'te',
        options: [
          { value: 'te', label: '0.1X TE', short: '', detail: '', name: '0.1X TE' },
          { value: 'rsb', label: 'RSB', short: '', detail: '', name: 'RSB' },
          { value: 'nfw', label: 'Nuclease-free water', short: '', detail: '', name: 'nuclease-free water' }
        ] }
    ],
    params: [
      { key: 'ratio', label: 'Bead ratio', unit: '×', value: 1.2, ask: true, hint: 'e.g. 1.2× removes most fragments under ~150 bp; lower keeps larger fragments' },
      { key: 'vol', label: 'Volume being cleaned', unit: 'µL', value: 50, ask: true },
      { key: 'elute', label: 'Elution volume', unit: 'µL', value: 30, ask: true }
    ],
    stages: [
      {
        id: 'cl-prep', title: 'Bead resuspension', time: '~30 min',
        summary: 'Beads at room temperature and fully resuspended.',
        steps: [
          { id: 'cl-rt', text: 'If the {beads.name} were not stored at room temperature, let them reach room temperature.', timers: [{ min: 30, label: 'beads to room temp' }] },
          { id: 'cl-etoh', text: 'Make fresh <b>80% ethanol</b>.',
            calc: { type: 'wash', per: 'sample', perWash: { by: 'tube', t02: 190, t15: 400 }, washes: 2, ethanol: 0.8 } },
          { id: 'cl-vortex', text: 'Vortex the beads thoroughly right before use.' }
        ]
      },
      {
        id: 'cl-bind', title: 'Binding DNA to beads', time: '~15 min',
        summary: '{p.ratio}× beads on {p.vol} µL = {p.ratio*vol} µL of beads per sample.',
        steps: [
          { id: 'cl-add', critical: true, text: 'Add <b>{p.ratio*vol} µL of beads ({p.ratio}×)</b> to each {p.vol} µL sample. Mix well by pipetting at least 10 times (or vortex 3–5 s on high).',
            calc: { type: 'beads', ratio: { param: 'ratio' }, volume: { param: 'vol' }, per: 'sample', what: 'sample', beadName: '{beads.name}' },
            tip: 'The bead ratio sets the size selection: the lower the ratio, the larger the fragments kept. e.g. 60 µL beads on 50 µL (1.2×) removes most fragments under 150 bp.' },
          { id: 'cl-spin', text: 'Quick-spin if needed to collect the liquid, but don\'t let the beads settle at the bottom.' },
          { id: 'cl-inc', text: 'Incubate at room temperature.', timers: [{ min: 10, label: 'bead binding' }] },
          { id: 'cl-pellet', text: 'Place on the {tube.size} magnetic stand until the solution is clear (~1–5 min). <b>Remove and discard the supernatant</b> without disturbing the beads.',
            warn: 'Do not discard the beads: they hold the DNA.' }
        ]
      },
      {
        id: 'cl-wash', title: 'Ethanol wash & drying', time: '~10 min',
        summary: 'Two washes of {tube.wash} µL 80% ethanol, then air-dry up to 5 min.',
        steps: [
          { id: 'cl-wash1', text: 'Still on the magnet, add <b>{tube.wash} µL of 80% ethanol</b>. Wait 30 s, then remove and discard it without disturbing the beads.', timers: [{ min: 0.5, label: 'ethanol wash' }] },
          { id: 'cl-wash2', text: 'Repeat: <b>{tube.wash} µL of 80% ethanol</b>, 30 s, remove. Take off any ethanol left with a P10.', timers: [{ min: 0.5, label: 'ethanol wash' }] },
          { id: 'cl-dry', critical: true, text: 'Air-dry on the magnet with the lid open, <b>up to 5 min</b>.', timers: [{ min: 5, label: 'drying (max)' }],
            warn: 'Do not over-dry: the beads should be dark brown and glossy. Cracked or light brown beads are too dry.' }
        ]
      },
      {
        id: 'cl-elute', title: 'Elution', time: '~15 min',
        summary: '{p.elute} µL of {elBuf.name}, 5 min, then the eluate into a new tube.',
        steps: [
          { id: 'cl-el-add', text: 'Take the tube off the magnet and add <b>{p.elute} µL of {elBuf.name}</b>. Mix by pipetting at least 10 times (or vortex), and quick-spin if needed.' },
          { id: 'cl-el-inc', text: 'Incubate on the bench at room temperature.', timers: [{ min: 5, label: 'elution' }] },
          { id: 'cl-collect', tube: { per: 'sample', suffix: 'CL', what: 'bead-cleaned DNA ({p.ratio}×, in {elBuf.name})', vessel: '1.5 mL Eppendorf or 0.2 mL tube', keep: true },
            text: 'Back on the magnet until clear (~5 min), then transfer <b>{p.elute} µL of eluate</b> to a new 1.5 mL Eppendorf or 0.2 mL tube.' },
          { id: 'cl-store', text: 'Store the cleaned DNA.', stop: '4 °C for use the next day, −20 °C for longer.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm12-libquant',
    name: 'NEBNext Library Quant for Illumina',
    short: 'SM12 Lib Quant',
    kit: 'NEBNext Library Quant Kit (qPCR)',
    vendor: 'NEB · QuantStudio 3 · SOP FSD 75-GN-SM12',
    source: 'From the lab SOP FSD 75 - GN - SM12 (30-12-2025) and the NEBNext Library Quant Kit for Illumina manual.',
    maxSamples: 12,
    choices: [
      { key: 'mmPrep', label: 'Master mix', question: 'Is this the first use of the Master Mix tube?', default: 'ready',
        options: [
          { value: 'first', label: 'Yes: first use', short: 'add primers + ROX', detail: 'Add 100 µL Primer Mix and 20 µL ROX (Low) to the Master Mix tube, and date it.' },
          { value: 'ready', label: 'No: already made up', short: 'primers + ROX in', detail: 'The Master Mix already has the primers and ROX (dated on the tube).' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra master mix', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'lq-thaw', title: 'Thaw and mix the kit', time: '~20 min',
        summary: 'Everything on ice once thawed.',
        steps: [
          { id: 'lq-thaw-mm', text: 'Thaw the <b>Library Quant Master Mix</b> and <b>Primer Mix</b>. Vortex the Primer Mix for 5 s. Put both on ice.' },
          { id: 'lq-thaw-std', text: 'Thaw the six <b>DNA Standards</b>. Pulse vortex each for ~1 s, spin briefly, and put on ice.',
            tip: 'Standard caps: 1 blue · 2 yellow · 3 green · 4 red · 5 white · 6 lilac.' },
          { id: 'lq-thaw-buf', text: 'Thaw the <b>Library Dilution Buffer (10X)</b>. Vortex at least 5 s, spin briefly, and put on ice.' }
        ]
      },
      {
        id: 'lq-mm', title: 'Master mix with primers', time: '~5 min',
        summary: 'First use only: 100 µL Primer Mix + 20 µL ROX (Low) into the Master Mix tube.',
        steps: [
          { id: 'lq-mm-primer', when: { mmPrep: 'first' }, critical: true, text: 'Add <b>100 µL Primer Mix</b> to the <b>Master Mix</b> tube.' },
          { id: 'lq-mm-rox', when: { mmPrep: 'first' }, critical: true, text: 'Add <b>20 µL ROX (Low)</b> to the Master Mix tube. Vortex at least 5 s and spin briefly.' },
          { id: 'lq-mm-date', when: { mmPrep: 'first' }, text: '<b>Write today\'s date</b> on the Master Mix tube.', stop: 'Store the made-up Master Mix at −20 °C.' },
          { id: 'lq-mm-ready', when: { mmPrep: 'ready' }, text: 'Use the Master Mix that already has the primers and ROX (check the date on the tube).' }
        ]
      },
      {
        id: 'lq-buf', title: '1X dilution buffer', time: '~5 min',
        summary: '1 part 10X buffer + 9 parts nuclease-free water. 1.2 mL per library.',
        steps: [
          { id: 'lq-buf-make', critical: true, text: 'Dilute the <b>10X Library Dilution Buffer 1:10</b> with nuclease-free water (e.g. 1 mL + 9 mL), and vortex at least 5 s.',
            calc: { type: 'dilute', title: '1X dilution buffer', stock: 10, target: 1, unit: 'X', perSample: 1.2, diluent: 'nuclease-free water', what: 'Library Dilution Buffer',
              note: 'Each library uses 999 + 90 + 90 µL; a little goes to the NTC.' } }
        ]
      },
      {
        id: 'lq-dil', title: 'Library dilutions', time: '~15 min',
        summary: '1:1,000 → 1:10,000 → 1:100,000 in 1X buffer. Vortex at least 5 s and spin after each.',
        steps: [
          { id: 'lq-d1', critical: true, tube: { per: 'sample', suffix: 'D1K', what: 'library diluted 1:1,000', vessel: '1.5 mL tube' },
            text: '<b>1:1,000</b>: <b>1 µL library</b> + <b>999 µL 1X buffer</b>. Vortex at least 5 s and spin briefly.' },
          { id: 'lq-d2', critical: true, tube: { per: 'sample', suffix: 'D10K', what: 'library diluted 1:10,000', vessel: 'PCR strip tube or 1.5 mL tube' },
            text: '<b>1:10,000</b>: <b>10 µL of the 1:1,000</b> + <b>90 µL 1X buffer</b>. Vortex at least 5 s and spin briefly.' },
          { id: 'lq-d3', critical: true, tube: { per: 'sample', suffix: 'D100K', what: 'library diluted 1:100,000', vessel: 'PCR strip tube or 1.5 mL tube' },
            text: '<b>1:100,000</b>: <b>10 µL of the 1:10,000</b> + <b>90 µL 1X buffer</b>. Vortex at least 5 s and spin briefly.' }
        ]
      },
      {
        id: 'lq-plate', title: 'qPCR set-up', time: '~30 min',
        summary: '10 µL reactions: 8 µL Master Mix + 2 µL standard, library dilution or 1X buffer (NTC). Standards and libraries in triplicate.',
        steps: [
          { id: 'lq-count', text: 'Plan the plate: <b>six standards in triplicate</b>, an <b>NTC</b>, and <b>each library at 1:10,000 and 1:100,000 in triplicate</b>.',
            calc: { type: 'count', title: 'Wells', unit: 'wells', perSample: 6, extra: 19, extraLabel: 'standard and NTC wells', max: 96, mmVol: 8, mmName: 'Master Mix (with primers)' } },
          { id: 'lq-layout', text: 'Lay out the plate. Here is one way to do it.',
            calc: { type: 'plate', reps: 3, standards: ['STD1', 'STD2', 'STD3', 'STD4', 'STD5', 'STD6'], ntc: 1, dilutions: ['10K', '100K'],
              note: '10K = 1:10,000, 100K = 1:100,000. Use the same layout when you enter the wells in the software.' } },
          { id: 'lq-rxn', critical: true, text: 'In each well: <b>8 µL Master Mix</b> + <b>2 µL</b> of the standard or library dilution. Mix by pipetting 5 times; avoid bubbles.' },
          { id: 'lq-ntc', text: 'NTC well: <b>8 µL Master Mix</b> + <b>2 µL 1X Dilution Buffer</b>. Mix by pipetting 5 times.' },
          { id: 'lq-seal', text: 'Seal the plate and spin it down to collect everything at the bottom of the wells.' }
        ]
      },
      {
        id: 'lq-run', title: 'qPCR run (QuantStudio 3)', time: '~45 min',
        summary: 'SYBR, ROX on, Fast mode. 95 °C 1 min → [95 °C 15 s, 63 °C 45 s + plate read] × 35.',
        steps: [
          { id: 'lq-settings', critical: true, text: 'On the instrument: <b>SYBR</b> setting, <b>ROX</b> selected, <b>Fast</b> mode.' },
          { id: 'lq-program', critical: true, text: 'Cycling: <b>95 °C 1 min</b> → <b>[95 °C 15 s, 63 °C 45 s] × 35</b>, with a <b>plate read at the end of each extension</b>.' },
          { id: 'lq-wells', text: 'Enter each standard, NTC and library dilution in its well in the software, then start the run.' },
          { id: 'lq-result', text: 'After the run, enter each library\'s concentration from the qPCR analysis.',
            reading: { key: 'qpcrNM', label: 'Library concentration (qPCR)', short: 'qPCR', unit: 'nM', per: 'sample', type: 'General', section: 'Quantification', noTube: true } }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm26-reamp',
    name: 'Re-Amplification of Indexed Illumina Libraries',
    short: 'SM26 Re-amp',
    kit: 'AmpliTaq Gold 360 / NEBNext Q5 · IS5 / IS6',
    vendor: 'In-house · SOP FSD 75-GN-SM26',
    source: 'From the lab SOP FSD 75 - GN - SM26 (07-04-2026), with the AmpliTaq Gold 360 and NEBNext Ultra II Q5 Master Mix protocols.',
    choices: [
      { key: 'pol', label: 'Polymerase', question: 'Which master mix?', default: 'amplitaq',
        options: [
          { value: 'amplitaq', label: 'AmpliTaq Gold 360 Master Mix', short: '95 °C 10 min start', detail: '95 °C 10 min → [95 °C 30 s, 60 °C 30 s, 72 °C 30 s] × cycles → 72 °C 7 min.', name: 'AmpliTaq Gold 360 Master Mix' },
          { value: 'q5', label: 'NEBNext Ultra II Q5 Master Mix', short: '98 °C 30 s start', detail: '98 °C 30 s → [98 °C 10 s, 58 °C 30 s, 65 °C 45 s] × cycles → 65 °C 5 min.', name: 'NEBNext Ultra II Q5 Master Mix' }
        ] }
    ],
    params: [
      { key: 'overage', label: 'Extra master mix', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'ra-prep', title: 'Before you start', time: '~15 min',
        summary: 'Make the master mix in a clean post-PCR area. Gloves, lab coat and face mask.',
        steps: [
          { id: 'ra-area', text: 'Work in a <b>clean post-PCR area</b> for the master mix, with an ice block.' },
          { id: 'ra-thaw', text: 'Thaw on ice: <b>{pol.name}</b>, <b>IS5 primer (10 µM)</b>, <b>IS6 primer (10 µM)</b>, nuclease-free water and the <b>library samples</b>.' }
        ]
      },
      {
        id: 'ra-mm', title: 'Master mix', time: '~10 min',
        summary: '24 µL per reaction: 12.5 µL master mix + 9 µL water + 1.25 µL IS5 + 1.25 µL IS6. One extra reaction for the NTC.',
        steps: [
          { id: 'ra-mix-reag', text: 'Vortex the <b>IS5</b> and <b>IS6</b> primers, then quick-spin. Gently pipette-mix the <b>{pol.name}</b>, then quick-spin.',
            warn: 'Do not vortex the master mix.' },
          { id: 'ra-mm-make', critical: true, text: 'Label a 1.5 mL Eppendorf tube <b>Master Mix</b>. Add in this order: <b>{pol.name}</b>, <b>nuclease-free water</b>, <b>IS5 primer</b>, <b>IS6 primer</b>.',
            calc: { type: 'mix', title: 'Re-amplification master mix', extraRxn: 1, extraLabel: 'NTC', perTube: [{ name: 'Library', vol: 1 }],
              reagents: [{ name: '{pol.name}', vol: 12.5 }, { name: 'Nuclease-free water', vol: 9 }, { name: 'IS5 primer (10 µM)', vol: 1.25 }, { name: 'IS6 primer (10 µM)', vol: 1.25 }] },
            tip: 'Final concentrations: 1X master mix, 0.5 µM of each primer, in 25 µL.' },
          { id: 'ra-mm-mix', text: 'Mix gently by pipetting at least 10 times, then spin.' }
        ]
      },
      {
        id: 'ra-rxn', title: 'Reactions', time: '~10 min',
        summary: '24 µL master mix + 1 µL library = 25 µL. NTC: 24 µL master mix + 1 µL water.',
        steps: [
          { id: 'ra-disp', critical: true, tube: { per: 'sample', suffix: 'RA1', what: 'library re-amplification ({pol.name})', vessel: 'PCR tube or plate well', keep: true },
            text: 'Dispense <b>24 µL of master mix</b> into each PCR tube or well, add <b>1 µL of library</b>, and mix gently by pipetting at least 10 times.' },
          { id: 'ra-ntc', critical: true, text: '<b>NTC</b>: 24 µL of master mix + <b>1 µL nuclease-free water</b> in its own tube or well. Mix by pipetting; avoid bubbles.' }
        ]
      },
      {
        id: 'ra-pcr', title: 'PCR', time: '~1 h',
        summary: 'Cycles depend on the sample input type and its mass.',
        steps: [
          { id: 'ra-run-at', when: { pol: 'amplitaq' }, critical: true, text: 'AmpliTaq Gold 360 program: <b>95 °C 10 min</b> → <b>[95 °C 30 s, 60 °C 30 s, 72 °C 30 s] × cycles</b> → <b>72 °C 7 min</b> → 4 °C hold.',
            tip: 'The number of cycles depends on the sample input type and its mass.',
            reading: { key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'PCR', chain: false } },
          { id: 'ra-run-q5', when: { pol: 'q5' }, critical: true, text: 'Q5 program: <b>98 °C 30 s</b> → <b>[98 °C 10 s, 58 °C 30 s, 65 °C 45 s] × cycles</b> → <b>65 °C 5 min</b> → 4 °C hold.',
            tip: 'The number of cycles depends on the sample input type and its mass.',
            reading: { key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'PCR', chain: false } },
          { id: 'ra-done', text: 'When the program finishes, take out the tubes. The re-amplified libraries are ready for the next step.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm04-ultra2fs',
    name: 'NEBNext Ultra II FS DNA Library Prep',
    short: 'SM04 Ultra II FS',
    kit: 'NEBNext Ultra II FS DNA (half volume)',
    vendor: 'NEB · SOP FSD 75-GN-SM04',
    source: 'From the lab SOP FSD 75 - GN - SM04 (30-12-2025), with bead clean-ups from SOP SM11. Can also run on the epMotion 5075 (all but the PCR set-up).',
    barcodes: NEB_UDI_WELLS,
    barcodeLabel: 'Index well',
    maxSamples: 96,
    choices: [
      { key: 'sampleType', label: 'Samples', question: 'What kind of samples?', default: 'standard',
        options: [
          { value: 'standard', label: 'Standard samples', short: '0.9× beads', detail: '0.9× bead clean-up after adaptor ligation.', ratio: '0.9' },
          { value: 'forensic', label: 'Forensic samples', short: '1.2× beads', detail: 'The SOP notes 1.2× is best for forensic samples: 1.2× bead clean-up after adaptor ligation.', ratio: '1.2' }
        ] }
    ],
    params: [
      { key: 'fragMin', label: 'Fragmentation time at 37 °C', unit: 'min', value: 5, ask: true, hint: '5–8 min: shorter gives larger fragments; set it for the size of your extract' },
      { key: 'overage', label: 'Extra in master mixes', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'fs-prep', title: 'Before you start', time: '~30 min',
        summary: 'Pre-PCR room. Gloves, lab coat and face mask.',
        steps: [
          { id: 'fs-beads-rt', text: 'Take the <b>sample purification beads</b> out of the fridge so they reach room temperature.', timers: [{ min: 30, label: 'beads to room temp' }] },
          { id: 'fs-te', text: 'Make <b>0.1X TE</b> for the elutions: 1 part 1X TE + 9 parts nuclease-free water.',
            calc: { type: 'dilute', title: '0.1X TE', stock: 1, target: 0.1, unit: 'X', perSample: 0.051, diluent: 'nuclease-free water', what: 'TE', minMake: 1 } },
          { id: 'fs-qc', text: 'Enter each DNA sample\'s <b>Qubit</b>. Leave "DNA µL" blank to use the full 13 µL, or type less for a concentrated sample.',
            readings: [
              { key: 'qIn', label: 'DNA Qubit', short: 'Input Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Library prep' },
              { key: 'dnaVol', label: 'DNA µL used (blank = 13)', short: 'DNA µL', unit: 'µL', per: 'sample', optional: true, chain: false, noExport: true }
            ],
            calc: { type: 'input', title: 'FS input', readingKey: 'qIn', volKey: 'dnaVol', maxVol: 13, maxNg: 500,
              note: 'DNA + water to 13 µL. The input sets the adaptor dilution.' } }
        ]
      },
      {
        id: 'fs-frag', title: 'Fragmentation / end prep', time: '~45 min',
        summary: '13 µL DNA + 3.5 µL FS Reaction Buffer + 1 µL FS Enzyme Mix = 17.5 µL. 37 °C {p.fragMin} min, 65 °C 30 min, lid 75 °C.',
        steps: [
          { id: 'fs-thaw', text: 'Thaw the <b>FS Enzyme Mix</b> and vortex 5–8 s. Thaw the <b>FS Reaction Buffer</b> and vortex 3–5 s. Put both on ice.' },
          { id: 'fs-mix', critical: true, tube: { per: 'sample', suffix: 'FS1', what: 'fragmentation/end prep, then adaptor ligation (same tube)', vessel: '0.2 mL PCR tube' },
            text: 'In a 0.2 mL PCR tube: <b>13 µL DNA</b>, <b>3.5 µL FS Reaction Buffer</b> and <b>1 µL FS Enzyme Mix</b> (yellow caps). <b>Vortex the reaction for 5 s</b> and spin briefly.',
            calc: { type: 'mix', title: 'Fragmentation / end prep', perTube: [{ name: 'DNA + water', vol: 13 }],
              reagents: [{ name: 'FS Reaction Buffer', vol: 3.5 }, { name: 'FS Enzyme Mix', vol: 1 }] } },
          { id: 'fs-inc', critical: true, text: 'Thermal cycler, heated lid <b>75 °C</b>: <b>37 °C for {p.fragMin} min</b> → <b>65 °C 30 min</b> → 4 °C hold.',
            timers: [{ min: { param: 'fragMin', plus: 30 }, label: 'FS program (37 °C → 65 °C)' }],
            tip: 'The 37 °C time sets the fragment size: shorter time, larger fragments (5–8 min). Change it in settings for this run.' }
        ]
      },
      {
        id: 'fs-lig', title: 'Adaptor ligation', time: '~45 min',
        summary: 'Adaptor first, then ligation master mix + enhancer (34.25 µL). 20 °C 15 min lid off, then USER 37 °C 15 min (lid 50 °C).',
        steps: [
          { id: 'fs-lig-thaw', text: 'Thaw the <b>Ligation Master Mix</b> and the <b>Ligation Enhancer</b>, pipette up and down, and put on ice.',
            tip: 'The Ligation Master Mix is viscous: pipette it carefully.' },
          { id: 'fs-adaptor', critical: true, text: 'Check whether each library needs a <b>diluted adaptor</b> (to avoid adaptor dimers). Dilute in <b>10 mM Tris-HCl / 10 mM NaCl</b>; vortex 3–5 s and quick-spin before each dilution.',
            calc: { type: 'adaptor', perSample: 1.25, diluent: 'adapter dilution buffer',
              bands: [{ above: 99.999, fold: 1, conc: 'no dilution' }, { above: 4.999, fold: 10, conc: '5–99 ng', how: '1 µL adaptor + 10 µL adapter dilution buffer' },
                { above: 0.999, fold: 25, conc: '1–5 ng', how: '4 µL of the 1:10 + 6 µL adapter dilution buffer' }, { above: -1, fold: 50, conc: 'under 1 ng', how: '5 µL of the 1:25 + 5 µL adapter dilution buffer' }],
              note: 'SOP table: 100–500 ng no dilution · 5–99 ng 1:10 · 1–5 ng 1:25 · under 1 ng 1:50.' } },
          { id: 'fs-lig-adaptor', critical: true, text: 'Add <b>1.25 µL adaptor</b> (red cap, diluted if needed) to each 17.5 µL reaction and mix.',
            warn: 'Adaptor first, then the ligation master mix and enhancer.' },
          { id: 'fs-lig-mix', text: 'Add <b>15 µL Ligation Master Mix</b> and <b>0.5 µL Ligation Enhancer</b> (34.25 µL). Pipette up and down 10–20 times and spin down.',
            calc: { type: 'mix', title: 'Ligation', perTube: [{ name: 'FS reaction + adaptor', vol: 18.75 }],
              reagents: [{ name: 'Ligation Master Mix', vol: 15 }, { name: 'Ligation Enhancer', vol: 0.5 }] } },
          { id: 'fs-lig-inc', critical: true, text: 'Incubate at <b>20 °C for 15 min with the heated lid OFF</b>.', timers: [{ min: 15, label: 'ligation 20 °C' }] },
          { id: 'fs-user', text: 'Add <b>1.5 µL USER Enzyme</b>, mix well and spin down. Incubate at <b>37 °C for 15 min</b>, heated lid <b>50 °C</b>.',
            timers: [{ min: 15, label: 'USER 37 °C' }],
            calc: { type: 'mix', title: 'USER', noMaster: true, perTube: [{ name: 'USER Enzyme', vol: 1.5 }], totals: [{ name: 'USER Enzyme', vol: 1.5 }] } },
          { id: 'fs-lig-stop', text: 'Continue, or store the ligated DNA.', stop: 'Store overnight at −20 °C.' }
        ]
      },
      {
        id: 'fs-c1', title: 'Clean-up {sampleType.ratio}× (pre-PCR)', time: '~30 min',
        summary: 'SOP SM11: {sampleType.ratio}× beads on the 35.75 µL ligation, elute in 16 µL 0.1X TE.',
        steps: [].concat(
          beadCleanup({ id: 'fs-c1s', ratio: 0.9, vol: 35.75, what: 'ligation reaction', tube: '0.2', elute: 16, buffer: '0.1X TE',
            out: { suffix: 'ALC', what: 'adaptor-ligated DNA, cleaned', keep: true, store: '7.5 µL goes into the PCR; store the rest at −20 °C' } }).map((s) => Object.assign(s, { when: { sampleType: 'standard' } })),
          beadCleanup({ id: 'fs-c1f', ratio: 1.2, vol: 35.75, what: 'ligation reaction', tube: '0.2', elute: 16, buffer: '0.1X TE',
            out: { suffix: 'ALC', what: 'adaptor-ligated DNA, cleaned', keep: true, store: '7.5 µL goes into the PCR; store the rest at −20 °C' } }).map((s) => Object.assign(s, { when: { sampleType: 'forensic' } })),
          [{ id: 'fs-c1-stop', text: 'Continue, or store the cleaned ligated DNA.', stop: 'Store at −20 °C.' }])
      },
      {
        id: 'fs-pcr', title: 'PCR enrichment', time: '~45 min',
        summary: '7.5 µL DNA + 12.5 µL Q5 Master Mix + 5 µL index primers = 25 µL. Lid 105 °C.',
        steps: [
          { id: 'fs-pcr-thaw', text: 'Thaw the <b>Q5 Master Mix</b> (blue cap), pipette up and down slowly, and spin. Thaw and spin down the <b>index plate</b> (NEBNext Multiplex Oligos, 96 Unique Dual Index Primer Pairs, 10 µM combined) before taking from it.' },
          { id: 'fs-idx-pick', critical: true, exportSection: 'Index PCR', text: 'Give each sample its own <b>index well</b> and note it down.',
            calc: { type: 'barcodes', title: 'Index map', note: 'The index for every sample is needed for the sample sheet.' } },
          { id: 'fs-pcr-mix', critical: true, tube: { per: 'sample', suffix: 'PC1', what: 'index PCR ({barcode})', vessel: '0.2 mL PCR tube' },
            text: 'In a new 0.2 mL PCR tube: <b>7.5 µL adaptor-ligated DNA</b>, <b>12.5 µL Q5 Master Mix</b>, <b>5 µL index primers</b> (25 µL). Pipette the whole volume up and down at least 10 times, then quick vortex and spin.',
            calc: { type: 'mix', title: 'Index PCR', perTube: [{ name: 'Adaptor-ligated DNA', vol: 7.5 }, { name: 'Index primers (its own well)', vol: 5 }],
              reagents: [{ name: 'NEBNext Ultra II Q5 Master Mix', vol: 12.5 }] },
            tip: 'Only 7.5 µL is used: put the rest of the ALC tube back at −20 °C.' },
          { id: 'fs-pcr-run', critical: true, text: 'Thermal cycler, heated lid <b>105 °C</b>: <b>98 °C 30 s</b> → <b>[98 °C 10 s, 65 °C 1 min 15 s] × 5–18 cycles</b> → <b>65 °C 5 min</b> → 4 °C hold.',
            reading: { key: 'pcrCycles', label: 'Cycles run', short: 'Cycles', unit: 'cycles', per: 'sample', type: 'General', section: 'Index PCR', chain: false } }
        ]
      },
      {
        id: 'fs-c2', title: 'PCR clean-up 0.9×', time: '~30 min',
        summary: 'SOP SM11: 0.9× beads on the 25 µL PCR, elute in 35 µL 0.1X TE.',
        steps: beadCleanup({ id: 'fs-c2', ratio: 0.9, vol: 25, what: 'PCR reaction', tube: '0.2', elute: 35, buffer: '0.1X TE',
          out: { suffix: 'LIB', what: 'final library ({barcode})', keep: true } })
          .concat([{ id: 'fs-c2-stop', text: 'Continue, or store the libraries.', stop: 'Store at −20 °C.' }])
      },
      {
        id: 'fs-qc2', title: 'Library QC', time: '~30 min',
        summary: 'Qubit (SOP SM09) and TapeStation (SOP SM10).',
        steps: [
          { id: 'fs-lib-qc', text: 'Measure each library with <b>Qubit</b> and run a <b>TapeStation</b>.',
            readings: [
              { key: 'qLib', label: 'Library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'QC' },
              { key: 'tsLib', label: 'Library TapeStation peak size', short: 'Library size', unit: 'bp', per: 'sample', type: 'TapeStation', section: 'QC', chain: false }
            ],
            calc: { type: 'yield', readingKey: 'qLib', eluate: 35, note: 'Total library = Qubit × 35 µL.' } }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm13-nextseq',
    name: 'Loading Illumina Flowcell',
    short: 'SM13 NextSeq load',
    kit: 'NextSeq 1000 · P1 / P2 cartridge',
    vendor: 'Illumina · SOP FSD 75-GN-SM13',
    source: 'From the lab SOP FSD 75 - GN - SM13 (30-12-2025) and the Illumina NextSeq 1000/2000 reference material. Enter the libraries in the pool as samples; readings are for the pool.',
    choices: [
      { key: 'app', label: 'Application', question: 'WGS or WES?', default: 'wgs',
        options: [
          { value: 'wgs', label: 'WGS', short: '600–700 pM', detail: 'Whole genome sequencing: load at 600–700 pM (set the exact value below).', pm: 'WGS loading concentration' },
          { value: 'wes', label: 'WES', short: '1000 pM', detail: 'Whole exome sequencing: load at 1000 pM.', pm: '1000 pM (WES)' }
        ] },
      { key: 'fc', label: 'Flow cell', question: 'Which flow cell?', default: 'p2-300',
        options: [
          { value: 'p1-100', label: 'P1 · 100 cycles', short: '', detail: '' },
          { value: 'p1-300', label: 'P1 · 300 cycles', short: '', detail: '' },
          { value: 'p2-100', label: 'P2 · 100 cycles', short: '', detail: '' },
          { value: 'p2-300', label: 'P2 · 300 cycles', short: '', detail: '' }
        ] }
    ],
    params: [
      { key: 'wgsPM', label: 'WGS loading concentration', unit: 'pM', value: 650, ask: true, hint: 'SOP: 600–700 pM (WES is always 1000 pM)' },
      { key: 'phixPct', label: 'PhiX', unit: '%', value: 2, ask: true, hint: 'low-diversity libraries 5–10%, high-diversity 1–2%' },
      { key: 'phixStock', label: 'PhiX stock', unit: 'nM', value: 10, hint: 'check the PhiX tube' }
    ],
    stages: [
      {
        id: 'nx-thaw', title: 'Day before: thaw the cartridge', time: '6 h',
        summary: 'Thaw at room temperature for 6 h, then into the post-PCR fridge. Load the next day.',
        steps: [
          { id: 'nx-lot', critical: true, text: 'Take the <b>{fc.label}</b> flow cell and its cartridge. Check that the cartridge and flow cell have the <b>same LOT number</b>.' },
          { id: 'nx-thaw-ct', critical: true, text: 'Take the cartridge out of the freezer and thaw it at <b>room temperature for 6 hours</b>.', timers: [{ min: 360, label: 'cartridge thaw' }],
            warn: 'Once a cartridge has been thawed and refrigerated it must be used: it cannot go back in the freezer.' },
          { id: 'nx-fridge', text: 'After 6 hours, put the cartridge in the <b>post-PCR fridge</b>. It is best used the next day.', stop: 'Continue tomorrow. Flow cells are kept in the post-PCR room fridge.' }
        ]
      },
      {
        id: 'nx-mol', title: 'Pool molarity', time: '~20 min',
        summary: 'Qubit of the pooled (or single) library, then nM from the average library size.',
        steps: [
          { id: 'nx-qubit', text: 'Measure the pooled (or single-plex) library with <b>Qubit</b>, and enter its <b>average library size</b> (TapeStation).',
            readings: [
              { key: 'qPool', label: 'Pool Qubit', short: 'Pool Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Quantification' },
              { key: 'tsPool', label: 'Average library size', short: 'Library size', unit: 'bp', per: 'pool', type: 'TapeStation', section: 'Quantification', chain: false }
            ],
            calc: { type: 'molarity', readingKey: 'qPool', lengthKey: 'tsPool' } }
        ]
      },
      {
        id: 'nx-2nm', title: 'Dilute to 2 nM', time: '~30 min',
        summary: 'Serial dilutions in RSB with Tween 20, 20 µL each, Qubit after every dilution, until 2 nM ± 0.1.',
        steps: [
          { id: 'nx-serial', critical: true, tube: { per: 'pool', suffix: '2NM', what: 'pool at 2 nM (RSB + Tween 20)', vessel: '1.5 mL tube' },
            text: 'Dilute with <b>RSB with Tween 20</b> (C₁V₁ = C₂V₂, <b>20 µL</b> final each time). After each dilution, <b>Qubit it and enter the reading</b> here; repeat until <b>2 nM ± 0.1</b>.',
            reading: { key: 'qDil', label: 'Qubit of your latest dilution', short: 'Diluted Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'Quantification', chain: false, optional: true },
            calc: { type: 'serial', readingKey: 'qPool', dilKey: 'qDil', lengthKey: 'tsPool', target: 2, tol: 0.1, finalVol: 20, maxFold: 2.5, diluent: 'RSB with Tween 20' },
            tip: 'The steps depend on where you start (e.g. 68 → 34 → 14 → 7 → 2 nM). Smaller steps give more control. Label each tube with its nM.' }
        ]
      },
      {
        id: 'nx-load-mix', title: 'Loading dilution & PhiX', time: '~15 min',
        summary: '2 nM → {app.short}; PhiX the same way. 20 µL loaded in total, {p.phixPct}% of it PhiX.',
        steps: [
          { id: 'nx-lib-pm', critical: true, tube: { per: 'pool', suffix: 'LDP', what: 'pool at the loading concentration', vessel: '1.5 mL tube' },
            text: 'Dilute the 2 nM pool to the loading concentration (<b>{app.pm}</b>) with RSB with Tween 20.',
            calc: { type: 'loadmix', from: 2, targetPM: { by: 'app', wgs: { param: 'wgsPM' }, wes: 1000 }, finalVol: 20, phixParam: 'phixPct', phixStockParam: 'phixStock', diluent: 'RSB with Tween 20' } },
          { id: 'nx-phix', text: 'Dilute the <b>PhiX</b> stock to 2 nM, then to the same loading concentration, with the same steps.',
            tip: 'Low-diversity libraries: 5–10% PhiX. High-diversity: 1–2%. Change it in settings.' },
          { id: 'nx-mix', critical: true, tube: { per: 'pool', suffix: 'LOAD', what: 'library + PhiX, ready to load (20 µL)', vessel: '1.5 mL tube' },
            text: 'In a new tube, mix the library and PhiX (both at loading concentration) for <b>20 µL</b> in total, as shown above.' }
        ]
      },
      {
        id: 'nx-cart', title: 'Load the cartridge', time: '~10 min',
        summary: 'Mix the cartridge, insert the flow cell, then 20 µL into the foil-sealed well.',
        steps: [
          { id: 'nx-unpack', text: 'Take the cartridge out of its packaging. <b>Gently invert and swirl clockwise</b> to mix the reagents, then put it on a flat surface.' },
          { id: 'nx-fc', text: 'Insert the <b>flow cell</b> into the cartridge, and take off the flow cell cover before loading.' },
          { id: 'nx-pierce', text: 'Find the <b>foil-sealed opening at the bottom left</b>. Pierce the foil with a clean pipette tip, making the hole big enough for your pipette.' },
          { id: 'nx-load', critical: true, text: 'P20 or P100 set to <b>20 µL</b>: draw up the sample, put the tip into the hole, touch the bottom, lift slightly and dispense to the <b>first stop</b>. Lift a little higher and press to the <b>second stop</b>, then take the pipette out carefully.' }
        ]
      },
      {
        id: 'nx-run', title: 'Start the run', time: '~5 min',
        summary: 'NextSeq 1000.',
        steps: [
          { id: 'nx-old', text: 'If a used flow cell and cartridge are still in the instrument, take them out and put them in the <b>recycling box</b> in the cabinet.' },
          { id: 'nx-insert', text: 'Insert the new flow cell and cartridge following the instructions on the screen.' },
          { id: 'nx-start', critical: true, text: 'Press <b>"Start Run"</b> and check that sequencing has started.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm16-minelute',
    name: 'MinElute Purification',
    short: 'SM16 MinElute',
    kit: 'QIAGEN MinElute columns · Buffers PB / PE',
    vendor: 'QIAGEN · SOP FSD 75-GN-SM16',
    source: 'From the lab SOP FSD 75 - GN - SM16 (30-12-2025) and the QIAGEN MinElute handbook. Use it for the bone lysate from SM02 too.',
    params: [
      { key: 'vol', label: 'Sample (lysate) volume', unit: 'µL', value: 50, ask: true, hint: 'Buffer PB is 5× this; e.g. 1000 µL for a bone lysate' },
      { key: 'elute', label: 'Elution volume (0.1X TE)', unit: 'µL', value: 20, ask: true, hint: 'SOP: 10–50 µL' },
      { key: 'overage', label: 'Extra buffer', unit: '%', value: 10 }
    ],
    stages: [
      {
        id: 'me-prep', title: 'Before you start', time: '~20 min',
        summary: 'Work in a biological safety cabinet. UV the reagents and tubes first.',
        steps: [
          { id: 'me-bsc', text: 'Work in a <b>biological safety cabinet</b>. <b>UV the reagents and tubes</b> beforehand.' },
          { id: 'me-pe', critical: true, text: 'Check that <b>ethanol has been added to Buffer PE</b> (done the first time the bottle is used; see the bottle label).' },
          { id: 'me-reag', text: 'Get the buffers ready: <b>750 µL Buffer PE</b> per column, <b>Buffer PB at 5× the sample volume</b> ({p.vol*5} µL per sample), and <b>0.1X TE</b> for the elution.',
            calc: { type: 'mix', title: 'Buffers per sample', noMaster: true, noTotal: true,
              perTube: [{ name: 'Sample', vol: { param: 'vol' } }, { name: 'Buffer PB (5×)', vol: { param: 'vol', factor: 5 } }, { name: 'Buffer PE (wash)', vol: 750 }, { name: '0.1X TE (elution)', vol: { param: 'elute' } }],
              totals: [{ name: 'Buffer PB', vol: { param: 'vol', factor: 5 } }, { name: 'Buffer PE', vol: 750 }, { name: '0.1X TE', vol: { param: 'elute' } }] } }
        ]
      },
      {
        id: 'me-bind', title: 'Bind', time: '~10 min',
        summary: 'Sample + Buffer PB (1:5), up to 750 µL at a time through the column.',
        steps: [
          { id: 'me-pulse', text: 'Pulse-centrifuge the samples.' },
          { id: 'me-pb', critical: true, tube: { per: 'sample', suffix: 'PB1', what: 'sample in Buffer PB (binding mix)', vessel: '1.5 mL tube (15 mL tube for large volumes)' },
            text: 'Add the sample to <b>Buffer PB at 1:5</b>: <b>{p.vol} µL sample + {p.vol*5} µL PB</b>. Mix by inverting the tube <b>10 times</b>.',
            calc: { type: 'loads', vol: { param: 'vol' }, factor: 6, per: 750, reagent: 'Buffer PB' } },
          { id: 'me-load', critical: true, text: 'Add <b>up to 750 µL</b> of the mix to the MinElute column. Centrifuge <b>1 min at maximum speed</b> and discard the flow-through. Repeat until all of the mix has gone through.' }
        ]
      },
      {
        id: 'me-wash', title: 'Wash & dry', time: '~5 min',
        summary: '750 µL Buffer PE, then a dry spin.',
        steps: [
          { id: 'me-pe-wash', text: 'Add <b>750 µL Buffer PE</b> to the column. Centrifuge <b>1 min at maximum speed</b> and discard the flow-through.' },
          { id: 'me-dry', critical: true, text: '<b>Dry spin</b>: centrifuge the empty column <b>1 min at maximum speed</b>, and discard the flow-through.',
            tip: 'The dry spin removes the last of the ethanol in Buffer PE, which would otherwise carry into the eluate.' }
        ]
      },
      {
        id: 'me-elute', title: 'Elute', time: '~5 min',
        summary: '{p.elute} µL of 0.1X TE on the centre of the column, 1 min, then spin.',
        steps: [
          { id: 'me-tube', tube: { per: 'sample', suffix: 'ME', what: 'MinElute eluate (0.1X TE)', vessel: 'sterile 1.5 mL Eppendorf tube', keep: true },
            text: 'Put the MinElute column in a <b>new sterile 1.5 mL Eppendorf tube</b>.' },
          { id: 'me-te', critical: true, text: 'Add <b>{p.elute} µL of 0.1X TE</b> to the <b>centre of the column</b>. Incubate at room temperature.', timers: [{ min: 1, label: 'elution' }] },
          { id: 'me-spin', text: 'Centrifuge <b>1 min at maximum speed</b>.', tip: 'If there is clearly less eluate than expected, centrifuge again.' },
          { id: 'me-qc', text: 'Discard the column and measure the extract with <b>Qubit</b>.',
            reading: { key: 'qME', label: 'Extract Qubit', short: 'Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Extraction' },
            calc: { type: 'yield', readingKey: 'qME', eluate: { param: 'elute' }, note: 'Total DNA = Qubit × the elution volume.' } }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm18-exome-enrich',
    name: 'Illumina Exome Enrichment',
    short: 'SM18 Exome enrich',
    kit: 'Illumina DNA Prep with Exome 2.5 Enrichment',
    vendor: 'Illumina / Twist · SOP FSD 75-GN-SM18',
    source: 'From the lab SOP FSD 75 - GN - SM18 (30-12-2025). Continues from SM05 (pre-enriched libraries). One pool per run: enter the pre-enriched libraries as samples (up to 12). Post-PCR room throughout.',
    maxSamples: 12,
    choices: [
      { key: 'pooling', label: 'Pooling', question: 'Pool by mass or by volume?', default: 'mass',
        options: [
          { value: 'mass', label: 'By mass', short: 'equal ng each', detail: 'Needed for 10–49 ng gDNA inputs; can be used for 50–1000 ng. Volume each = target mass ÷ concentration.' },
          { value: 'volume', label: 'By volume', short: 'equal µL each', detail: 'For saliva and blood, or 50–1000 ng gDNA with libraries in a similar range: 2.5 µL each (14 µL for a single library).' }
        ] },
      { key: 'mito', label: 'Mito panel', question: 'Add the Twist Mitochondrial Panel?', default: 'yes',
        options: [
          { value: 'yes', label: 'Yes', short: '2 µL Mito panel', detail: 'Exome 2.5 Plus panel 4 µL + Mitochondrial panel 2 µL + NFW 4 µL.', nfw: '4', thaw: ' and the Twist Mitochondrial Panel', add: '<b>2 µL Twist Mitochondrial Panel</b>', sum: 'Mito panel 2' },
          { value: 'no', label: 'No', short: 'exome only', detail: 'Exome 2.5 Plus panel 4 µL; the 2 µL of Mito panel is replaced with NFW (6 µL NFW) to keep 100 µL.', nfw: '6', thaw: '', add: 'no Mitochondrial Panel', sum: 'no Mito panel' }
        ] },
      { key: 'conc', label: 'Concentrate', question: 'Will the pooled volume be over 30 µL?', default: 'no',
        options: [
          { value: 'no', label: 'No: 30 µL or less', short: 'no concentrating', detail: 'The pool is made up to 30 µL with RSB.' },
          { value: 'yes', label: 'Yes: over 30 µL', short: 'concentrate with IPB', detail: 'Concentrate the pool with IPB (2.5× its volume) and elute in 32 µL RSB. The pooling calculator tells you if you need this.' }
        ] }
    ],
    params: [
      { key: 'poolNg', label: 'Target mass per library (pool by mass)', unit: 'ng', value: 300, ask: true, hint: 'recommended 250–500 ng; pick one that suits your libraries (250, 300, 350 …)' },
      { key: 'overage', label: 'Extra in master mixes', unit: '%', value: 0, hint: 'the SOP elution mix (28.5 + 1.5 µL per pool, 23 µL used) already has extra' }
    ],
    stages: [
      {
        id: 'en-prep', title: 'Before you start', time: '~2 h',
        summary: 'Post-PCR room. Some reagents need 2 h, so start them first.',
        steps: [
          { id: 'en-2h', critical: true, text: '<b>2 hours before capture</b>: bring <b>SMB3</b> to room temperature (vortex before use), and thaw <b>EEW</b> (vortex 30 s, 3×).', timers: [{ min: 120, label: 'SMB3 + EEW (2 h)' }] },
          { id: 'en-thaw', text: 'Thaw and vortex the <b>Twist Exome 2.5 Plus Panel</b>{mito.thaw}; bring <b>EHB2</b> to room temperature and vortex; thaw <b>EE1</b>, <b>HP3</b> (vortex, spin), <b>ET2</b> to room temperature (vortex, spin), <b>PPC</b> and <b>EPM</b> (invert, spin, on ice). Bring <b>IPB</b> and <b>RSB</b> to room temperature for 30 min and vortex.' },
          { id: 'en-nhb2', text: 'Thaw <b>NHB2</b>, heat it to <b>50 °C for 5 min</b>, then vortex on high for 10 s three times and spin.', timers: [{ min: 5, label: 'NHB2 at 50 °C' }] }
        ]
      },
      {
        id: 'en-pool', title: 'Pool pre-enriched libraries', time: '~20 min',
        summary: 'Up to 12 libraries, made up to 30 µL. Pool libraries with similar masses together.',
        steps: [
          { id: 'en-pool-mass', when: { pooling: 'mass' }, critical: true, tube: { per: 'pool', suffix: 'PL1', what: 'pool of pre-enriched libraries (30 µL), then the hybridisation', vessel: 'PCR tube' },
            text: 'Enter each library\'s <b>Qubit</b>. Add <b>target mass ÷ concentration</b> µL of each to the pool, and make up to <b>30 µL with RSB</b>.',
            reading: { key: 'qLib', label: 'Pre-enriched library Qubit', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Pooling' },
            calc: { type: 'poolmix', mode: 'mass', readingKey: 'qLib', massParam: 'poolNg', finalVol: 30, maxVol: 15, concFactor: 2.5, diluent: 'RSB',
              note: 'Recommended 250–500 ng per library. Over 30 µL in total: concentrate the pool first.' } },
          { id: 'en-pool-vol', when: { pooling: 'volume' }, critical: true, tube: { per: 'pool', suffix: 'PL1', what: 'pool of pre-enriched libraries (30 µL), then the hybridisation', vessel: 'PCR tube' },
            text: 'Add the same volume of each library and make up to <b>30 µL with RSB</b>: 2.5 µL each (a single library: 14 µL + 16 µL RSB).',
            reading: { key: 'qLib', label: 'Pre-enriched library Qubit (if measured)', short: 'Library Qubit', unit: 'ng/µL', per: 'sample', type: 'Qubit', section: 'Pooling', optional: true },
            calc: { type: 'poolmix', mode: 'volume', each: 2.5, single: 14, finalVol: 30, concFactor: 2.5, diluent: 'RSB' } }
        ]
      },
      {
        id: 'en-conc', title: 'Concentrate the pool (over 30 µL only)', time: '~25 min',
        summary: 'IPB at 2.5× the pool volume, two ethanol washes, elute in 32 µL RSB.',
        steps: [
          { id: 'en-c-ipb', when: { conc: 'yes' }, critical: true, tube: { per: 'pool', suffix: 'PLC', what: 'pool, concentrated (32 µL RSB)', vessel: 'Eppendorf tube' },
            text: 'Centrifuge the pool at 280 × g for 1 min and move it to a new Eppendorf tube. Vortex the IPB and add <b>2.5 × the pool volume</b> (see the pooling step). Vortex on high 10 s, 3×.' },
          { id: 'en-c-etoh', when: { conc: 'yes' }, text: 'Make fresh <b>80% ethanol</b>.', calc: { type: 'wash', per: 'pool', perWash: 200, washes: 2, ethanol: 0.8 } },
          { id: 'en-c-bind', when: { conc: 'yes' }, text: 'Incubate 5 min at room temperature, spin at 280 × g for 10 s, then on the magnet until clear (~5 min). <b>Remove and discard the supernatant.</b>', timers: [{ min: 5, label: 'IPB binding' }] },
          { id: 'en-c-wash', when: { conc: 'yes' }, text: 'On the magnet: <b>200 µL fresh 80% ethanol</b> away from the beads, 30 s, remove. <b>Twice.</b>', timers: [{ min: 0.5, label: 'wash 1' }, { min: 0.5, label: 'wash 2' }] },
          { id: 'en-c-dry', when: { conc: 'yes' }, text: 'Remove the last ethanol and air-dry for <b>5 min</b>.', timers: [{ min: 5, label: 'drying' }] },
          { id: 'en-c-elute', when: { conc: 'yes' }, text: 'Off the magnet: <b>32 µL RSB</b>, vortex on high 10 s, 3×, 5 min at room temperature, spin 280 × g 10 s, magnet until clear (~5 min). Transfer <b>32 µL</b> to a new tube.', timers: [{ min: 5, label: 'elution' }],
            stop: 'You can store the pool at −25 °C to −15 °C (up to 30 days).' },
          { id: 'en-c-skip', when: { conc: 'no' }, text: 'No concentrating needed: the pool is 30 µL. (If the pooling step says it is over 30 µL, change this in settings.)' }
        ]
      },
      {
        id: 'en-hyb', title: 'Hybridise probes', time: '1.5–16 h',
        summary: '100 µL: pool 30 + Exome panel 4 + {mito.sum} + NFW {mito.nfw} + NHB2 50 + EHB2 10. IEE-HYB program, lid 100 °C.',
        steps: [
          { id: 'en-hyb-mix', critical: true, text: 'Add to the 30 µL pool <b>in this order</b>: <b>4 µL Twist Exome 2.5 Plus Panel</b>, {mito.add}, <b>{mito.nfw} µL NFW</b>, <b>50 µL NHB2</b>, <b>10 µL EHB2</b>. Pipette mix 10× and spin at 280 × g for 30 s.',
            calc: { type: 'mix', title: 'Hybridisation mix', per: 'pool', noMaster: true,
              perTube: [{ name: 'Library pool', vol: 30 }, { name: 'Twist Exome 2.5 Plus Panel', vol: 4 }, { name: 'Twist Mitochondrial Panel', vol: { by: 'mito', yes: 2, no: 0 } }, { name: 'NFW', vol: { by: 'mito', yes: 4, no: 6 } }, { name: 'NHB2', vol: 50 }, { name: 'EHB2', vol: 10 }] },
            tip: 'The Mitochondrial panel is used diluted (optional).' },
          { id: 'en-hyb-run', critical: true, text: 'Run <b>IEE-HYB</b>, lid 100 °C: <b>98 °C 5 min</b> → <b>18 × 1 min</b> from 97 °C down 2 °C each cycle to 63 °C → <b>hold 62 °C for 1.5–16 h</b>.',
            timers: [{ min: 113, label: 'HYB to the end of the minimum hold' }],
            tip: 'Up to 16 h at 62 °C is fine (overnight). Get everything for capture ready before taking the sample out: capture starts straight away.' }
        ]
      },
      {
        id: 'en-cap', title: 'Capture hybridised probes', time: '~1.5 h',
        summary: 'Thermomixer at 62 °C, 700 rpm, lid always closed. SMB3 binding, three hot EEW washes, a transfer wash, then elute.',
        steps: [
          { id: 'en-cap-tm', critical: true, text: 'Before taking the sample out: preheat the <b>thermomixer to 62 °C, 700 rpm</b> (keep the lid closed). Preheat the <b>EEW</b> at 62 °C for 10 min, then put <b>1000 µL</b> per pool in an aliquot tube and keep it in the thermomixer.',
            timers: [{ min: 10, label: 'EEW preheat' }] },
          { id: 'en-cap-move', tube: { per: 'pool', suffix: 'CP1', what: 'capture: hybridised pool + SMB3', vessel: 'Eppendorf tube' },
            text: 'Take the sample out, spin at 280 × g for 30 s, and transfer <b>all 100 µL</b> to a new labelled tube.' },
          { id: 'en-cap-smb3', critical: true, text: 'Add <b>250 µL SMB3</b>. Vortex on high 10 s, 3×. Incubate in the thermomixer <b>15 min at 62 °C, 700 rpm</b>.', timers: [{ min: 15, label: 'SMB3 at 62 °C' }] },
          { id: 'en-cap-pellet', text: '<b>Immediately</b> spin at 280 × g for 30 s and put on the magnet until clear (~5 min). Remove and discard the supernatant (350 µL).' },
          { id: 'en-eew1', critical: true, text: 'Wash 1: off the magnet, add <b>200 µL hot EEW</b>, vortex on high 10 s, 3× (put the EEW back in the thermomixer). Incubate <b>5 min at 62 °C, 700 rpm</b>, spin 3 s, magnet until clear (~15 min), discard 200 µL.',
            timers: [{ min: 5, label: 'EEW wash 1 at 62 °C' }] },
          { id: 'en-eew2', text: 'Wash 2: the same, <b>200 µL hot EEW</b>, 5 min at 62 °C, magnet, discard.', timers: [{ min: 5, label: 'EEW wash 2 at 62 °C' }] },
          { id: 'en-eew3', text: 'Wash 3: the same, <b>200 µL hot EEW</b>, 5 min at 62 °C, magnet, discard.', timers: [{ min: 5, label: 'EEW wash 3 at 62 °C' }] },
          { id: 'en-eew-xfer', critical: true, tube: { per: 'pool', suffix: 'CP2', what: 'capture beads after the transfer wash', vessel: 'Eppendorf tube' },
            text: 'Transfer wash: off the magnet, <b>200 µL hot EEW</b>, vortex 10 s 3×, and transfer the <b>200 µL bead solution (your sample)</b> to a new labelled tube. 5 min at 62 °C, spin 3 s, magnet (5 min), discard 200 µL. Spin 280 × g 30 s, magnet 10 s, remove the last liquid.',
            timers: [{ min: 5, label: 'transfer wash at 62 °C' }] },
          { id: 'en-el-mm', text: 'Make the <b>elution mix</b>: EE1 + HP3. Vortex and spin at 280 × g for 10 s.',
            calc: { type: 'mix', title: 'Elution mix', per: 'pool', addVol: 23, perTube: [], reagents: [{ name: 'EE1', vol: 28.5 }, { name: 'HP3', vol: 1.5 }] } },
          { id: 'en-el', text: 'Off the magnet, add <b>23 µL elution mix</b>. Vortex on high 10 s, 3×. 2 min at room temperature, spin 280 × g 30 s, magnet until clear (~2 min).', timers: [{ min: 2, label: 'elution' }] },
          { id: 'en-el-xfer', critical: true, tube: { per: 'pool', suffix: 'EL1', what: 'captured library + ET2, then the AMP PCR', vessel: 'PCR tube' },
            text: 'Transfer <b>21 µL</b> of supernatant to a new labelled tube, add <b>4 µL ET2</b>, pipette mix 10× and spin at 280 × g for 30 s.' }
        ]
      },
      {
        id: 'en-amp', title: 'Amplify the enriched pool', time: '~30 min',
        summary: '25 µL + 5 µL PPC + 20 µL EPM = 50 µL. AMP program, 12 cycles, lid 100 °C.',
        steps: [
          { id: 'en-amp-mix', critical: true, text: 'Add <b>5 µL PPC</b> and <b>20 µL EPM</b>. Pipette mix 10× and spin at 280 × g for 30 s.',
            calc: { type: 'mix', title: 'AMP PCR mix', per: 'pool', noMaster: true, perTube: [{ name: 'Captured library + ET2', vol: 25 }, { name: 'PPC', vol: 5 }, { name: 'EPM', vol: 20 }] } },
          { id: 'en-amp-run', critical: true, text: 'Run <b>AMP</b>, lid 100 °C: <b>98 °C 45 s</b> → <b>12 × [98 °C 30 s, 60 °C 30 s, 72 °C 30 s]</b> → <b>72 °C 5 min</b> → 10 °C hold.',
            stop: 'You can store it at 2–8 °C for up to 24 h.' }
        ]
      },
      {
        id: 'en-clean', title: 'Clean up the enriched pool', time: '~30 min',
        summary: '45 µL + 40.5 µL IPB, two ethanol washes, elute in 34 µL RSB.',
        steps: [
          { id: 'en-cl-etoh', text: 'Make fresh <b>80% ethanol</b>.', calc: { type: 'wash', per: 'pool', perWash: 200, washes: 2, ethanol: 0.8 } },
          { id: 'en-cl-move', tube: { per: 'pool', suffix: 'AM1', what: 'amplified pool for the clean-up', vessel: 'Eppendorf tube' },
            text: 'Spin at 280 × g for 30 s, then transfer <b>45 µL</b> to a new tube.' },
          { id: 'en-cl-ipb', critical: true, text: 'Vortex the IPB and add <b>40.5 µL</b>. Vortex on high 10 s, 2×. 5 min at room temperature, spin 280 × g 1 min, magnet until clear (~5 min). Remove and discard the supernatant.',
            timers: [{ min: 5, label: 'IPB binding' }] },
          { id: 'en-cl-wash', text: 'On the magnet: <b>200 µL 80% ethanol</b> away from the beads, 30 s, remove. <b>Twice.</b>', timers: [{ min: 0.5, label: 'wash 1' }, { min: 0.5, label: 'wash 2' }] },
          { id: 'en-cl-dry', text: 'Remove the last ethanol and air-dry on the magnet for <b>5 min</b>.', timers: [{ min: 5, label: 'drying' }] },
          { id: 'en-cl-elute', text: 'Off the magnet: <b>34 µL RSB</b> onto the beads, vortex on high 10 s 2×, 5 min at room temperature, spin 280 × g 30 s, magnet until clear (~2 min).', timers: [{ min: 5, label: 'elution' }] },
          { id: 'en-cl-xfer', tube: { per: 'pool', suffix: 'ENR', what: 'exome-enriched library pool', vessel: 'Eppendorf tube', keep: true },
            text: 'Transfer <b>34 µL</b> to a new tube.', stop: 'Store at −25 °C to −15 °C (up to 30 days).' }
        ]
      },
      {
        id: 'en-qc', title: 'Check the enriched pool', time: '~30 min',
        summary: 'Qubit (SOP SM09) and TapeStation (SOP SM10) for size and adaptor dimers. Then load with SOP SM13.',
        steps: [
          { id: 'en-qc-read', text: 'Measure the enriched pool with <b>Qubit</b>, and run a <b>TapeStation</b> for the fragment size and adaptor dimers.',
            readings: [
              { key: 'qEnr', label: 'Enriched pool Qubit', short: 'Enriched Qubit', unit: 'ng/µL', per: 'pool', type: 'Qubit', section: 'QC' },
              { key: 'tsEnr', label: 'Enriched pool size (TapeStation)', short: 'Enriched size', unit: 'bp', per: 'pool', type: 'TapeStation', section: 'QC', chain: false }
            ] },
          { id: 'en-next', text: 'Go on to loading with the <b>Loading Illumina Flowcell</b> SOP (SM13).' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm19-vacuum',
    name: 'Vacuum Concentration',
    short: 'SM19 Vacuum conc',
    kit: 'Eppendorf Concentrator plus',
    vendor: 'Eppendorf · SOP FSD 75-GN-SM19',
    source: 'From the lab SOP FSD 75 - GN - SM19 (06-04-2026) and the Eppendorf Concentrator plus operating manual. The sample dries in its own tube (200 µL PCR tube or 1.5/2 mL tube).',
    params: [],
    stages: [
      {
        id: 'vc-load', title: 'Load', time: '~5 min',
        summary: 'Tubes in the rotor with the lids open, rotor balanced.',
        steps: [
          { id: 'vc-place', text: 'Put each sample tube in the <b>vacuum concentrator rotor with the lid open</b>.' },
          { id: 'vc-balance', critical: true, text: 'Make sure the <b>rotor is balanced</b> before you start.',
            tip: 'Place tubes opposite each other. With an odd number of tubes, add a balance tube with a similar volume of water.' }
        ]
      },
      {
        id: 'vc-run', title: 'Run', time: 'depends on the volume',
        summary: 'V-AQ mode, brake off, 30 °C, until all the liquid has evaporated.',
        steps: [
          { id: 'vc-settings', critical: true, text: 'Set the concentrator: <b>Mode V-AQ</b> (volume aqueous), <b>Brake OFF</b>, <b>30 °C</b>.' },
          { id: 'vc-start', text: 'Start the run and let it go until <b>all the liquid has evaporated</b>. The time depends on the starting volume.' },
          { id: 'vc-check', critical: true, text: 'When it stops, take the tubes out carefully and <b>check for any liquid left</b>. If there is, run another <b>15 min</b> (or longer, until fully dry).',
            timers: [{ min: 15, label: 'extra drying' }] },
          { id: 'vc-done', text: 'Go straight on with the next protocol step, or store the dried samples.', stop: 'Store the dried samples at −20 °C for up to 24 hours.' }
        ]
      }
    ]
  }
  ,
  {
    id: 'sm25-preidx-qpcr',
    name: 'Pre-Indexing Illumina Library Quantification',
    short: 'SM25 Pre-index qPCR',
    kit: 'Maxima SYBR Green/ROX qPCR Master Mix (2X) · IS7 / IS8',
    vendor: 'Thermo Scientific · QuantStudio · SOP FSD 75-GN-SM25',
    source: 'From the lab SOP FSD 75 - GN - SM25 (06-04-2026) and the Maxima SYBR Green/ROX qPCR Master Mix protocol.',
    maxSamples: 31,
    params: [
      { key: 'overage', label: 'Extra master mix', unit: '%', value: 0, hint: 'the SOP already makes 4 reactions per sample for a triplicate (1 spare)' }
    ],
    stages: [
      {
        id: 'pq-prep', title: 'Before you start', time: '~15 min',
        summary: 'Make the master mix in a clean pre-PCR area. Gloves, lab coat and face mask.',
        steps: [
          { id: 'pq-area', text: 'Work in a <b>clean pre-PCR area</b> for the master mix, with an ice block.' },
          { id: 'pq-thaw', text: 'Thaw on ice: <b>Maxima SYBR Green/ROX Master Mix (2X)</b>, <b>IS7 primer (10 µM)</b>, <b>IS8 primer (10 µM)</b>, nuclease-free water and the samples.',
            warn: 'Keep the SYBR Green/ROX Master Mix out of the light as much as you can: light lowers the SYBR signal.' }
        ]
      },
      {
        id: 'pq-mm', title: 'Master mix', time: '~10 min',
        summary: '24 µL per reaction. Each sample in triplicate: 4 reactions of master mix per sample (1 spare), plus 1 for the NTC.',
        steps: [
          { id: 'pq-mix-reag', text: 'Vortex the <b>IS7</b> and <b>IS8</b> primers, then quick-spin. Gently pipette-mix the Master Mix (2X), then quick-spin.',
            warn: 'Do not vortex the Master Mix.' },
          { id: 'pq-mm-make', critical: true, text: 'Label a 1.5 mL Eppendorf tube <b>Master Mix</b>. Add in this order: <b>Maxima SYBR Green/ROX Master Mix</b>, <b>nuclease-free water</b>, <b>IS7 primer</b>, <b>IS8 primer</b>.',
            calc: { type: 'mix', title: 'qPCR master mix', perSampleRxn: 4, extraRxn: 1, extraLabel: 'NTC', perTube: [{ name: 'Sample', vol: 1 }],
              reagents: [{ name: 'Maxima SYBR Green/ROX Master Mix (2X)', vol: 12.5 }, { name: 'Nuclease-free water', vol: 9 }, { name: 'IS7 primer (10 µM)', vol: 1.25 }, { name: 'IS8 primer (10 µM)', vol: 1.25 }] } },
          { id: 'pq-mm-mix', text: 'Mix gently by pipetting at least 10 times, then spin.' }
        ]
      },
      {
        id: 'pq-plate', title: 'Load the qPCR plate', time: '~15 min',
        summary: '24 µL master mix + 1 µL sample per well, each sample in triplicate. NTC: 24 µL + 1 µL water.',
        steps: [
          { id: 'pq-layout', text: 'Plan the plate: <b>each sample in triplicate</b> and an <b>NTC</b>.',
            calc: { type: 'plate', reps: 3, standards: [], ntc: 1, dilutions: [''], title: 'Plate layout',
              note: 'Use the same layout in the QuantStudio software: mark the NTC well and the sample (unknown) wells.' } },
          { id: 'pq-load', critical: true, text: 'Dispense <b>24 µL of master mix</b> into each sample well, add <b>1 µL of sample</b>, and mix gently by pipetting at least 10 times.' },
          { id: 'pq-ntc', critical: true, text: '<b>NTC</b>: 24 µL of master mix + <b>1 µL nuclease-free water</b> in a separate well. Mix by pipetting; avoid bubbles.' },
          { id: 'pq-seal', text: 'Seal the qPCR plate.' }
        ]
      },
      {
        id: 'pq-run', title: 'qPCR run (QuantStudio)', time: '~1.5 h',
        summary: '95 °C 10 min → 40 × [95 °C 30 s, 60 °C 30 s, 72 °C 30 s], then a melt curve.',
        steps: [
          { id: 'pq-wells', critical: true, text: 'In the software, mark which well is the <b>NTC</b> and which wells are the <b>unknowns (samples)</b>.' },
          { id: 'pq-settings', critical: true, text: 'Use the <b>SYBR</b> setting, <b>measure fluorescence at the end of every cycle</b>, and if ROX is the normalisation dye, check <b>ROX is selected</b>.' },
          { id: 'pq-program', critical: true, text: 'Cycling: <b>95 °C 10 min</b> → <b>40 × [95 °C 30 s, 60 °C 30 s, 72 °C 30 s]</b>.' },
          { id: 'pq-melt', text: 'Add a <b>melt curve</b>: 95 °C 15 s → 60 °C 1 min → ramp 60 → 95 °C with continuous acquisition. Then start the run.',
            tip: 'The melt curve checks specificity: primer dimers melt at a lower temperature than the real product.' },
          { id: 'pq-result', text: 'After the run, enter each sample\'s <b>mean Cq</b> (of the triplicate) and the NTC. Note anything odd in the melt curve.',
            readings: [
              { key: 'cq', label: 'Mean Cq (triplicate)', short: 'Cq', unit: 'Cq', per: 'sample', type: 'General', section: 'Quantification' },
              { key: 'ntcCq', label: 'NTC Cq (blank = no amplification)', short: 'NTC Cq', unit: 'Cq', per: 'pool', type: 'General', section: 'Quantification', optional: true, chain: false, noTube: true }
            ] }
        ]
      }
    ]
  }
];

// Show the protocols in SOP order (SM01, SM02, …).
const sopNo = (p) => { const m = /SM(\d+)/.exec(p.vendor || ''); return m ? +m[1] : 999; };
window.BENCH_PROTOCOLS.sort((a, b) => sopNo(a) - sopNo(b));
