# Asset provenance and licences / 资产来源与许可

## Atlas assets / 图谱资产

`atlas.bin` and `atlas.json` are the compact browser bundle used by the merged demo. They contain two fsaverage5 cortical hemispheres with direct vertex correspondence: 10,242 vertices and 20,480 faces per hemisphere.

| Asset | Representation in this repository | Source / origin |
| --- | --- | --- |
| fsaverage5 pial surface and sulcal depth | `atlas.bin` | fsaverage5 template from FreeSurfer, distributed through the Nilearn fsaverage5 dataset. |
| Destrieux anatomical labels | `atlas.bin` + `atlas.json` | Destrieux et al. (2010), `aparc.a2009s` labels distributed with FreeSurfer; the source bundle was retrieved through the Nilearn/NITRC route. |
| Yeo 2011 seven-network labels | `atlas.bin` + `atlas.json` | Thomas Yeo Lab / CBIG reference labels for fsaverage5. |

The binary packing preserves the source vertex and face order. Sulcal depth is stored as an 8-bit shading field. `atlas.json` records the offsets, array types and template metadata.

Before redistributing the atlas-derived files in another project, review the [FreeSurfer software licence](https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense), the [Nilearn licence](https://github.com/nilearn/nilearn/blob/main/LICENSE), and the [CBIG licence](https://github.com/ThomasYeoLab/CBIG/blob/master/LICENSE).

## Schematic structures / 示意结构

The hippocampus, amygdala, thalamus, cerebellum, brainstem, spinal cord and corpus callosum are hand-placed teaching geometry in `brain-view.mjs`. They are not sourced from a subcortical atlas and are intended to communicate approximate spatial relationships.

## Software / 软件

`three.module.js` is Three.js revision 160 and includes the upstream MIT licence header. `OrbitControls.js` is the corresponding Three.js control module. See the upstream [Three.js repository](https://github.com/mrdoob/three.js) for the full licence text.

## Explanatory sources / 解释来源

- Destrieux et al. (2010), *Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature*, NeuroImage.
- Yeo et al. (2011), *The organization of the human cerebral cortex estimated by intrinsic functional connectivity*, Journal of Neurophysiology. [DOI](https://doi.org/10.1152/jn.00606.2011)
- Scoville & Milner (1957), *Loss of recent memory after bilateral hippocampal lesions*, Journal of Neurology, Neurosurgery & Psychiatry.
- Raichle (2015), *The brain's default mode network*, Annual Review of Neuroscience. [DOI](https://doi.org/10.1146/annurev-neuro-071013-014030)
