'use strict';

angular.module('visitTypeForms', [])
  .value('visitTypeForms', {
    'Screening visit':[
      {'name': 'Baseline covariates', 'conditions':true, 'form': 'BaselineCovariates'},
      {'name': 'Observations and reviews', 'conditions':true, 'form': 'ObservationsAndReviews'},
      {'name': 'Clinical exam', 'conditions':true, 'form': 'ClinicalExam'},
      {'name': 'MPN-SAF TSS','conditions':true, 'form': 'MPNSAFTSS'},
      {'name': 'Labs', 'conditions':true, 'form': 'Labs'},
      {'name': 'Quantitative immunoglobulins', 'conditions': true, 'form': 'QuantitativeImmunoglobulins'},
      {'name': 'Biomarker specimens', 'conditions': true, 'form':'BiomarkerSpecimens'},
      {'name': 'Bone marrow', 'conditions':true, 'form': 'BoneMarrow'},
      {'name': 'CT scan diagnostics', 'conditions': true, 'form':'CTScanDiagnostics'},
      {'name': 'Disease assessment', 'conditions':'visit.BaselineCovariates && visit.BaselineCovariates.diagnosis === "Myelofibrosis (MF)"', 'form': 'DiseaseAssessment'}
    ],
    'Treatment period visit':[
      {'name': 'Drug administration', 'conditions': true, 'form': 'DrugAdministration'},
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'},
      {'name': 'Clinical exam', 'conditions': true, 'form': 'ClinicalExam'},
      {'name': 'MPN-SAF TSS','conditions':'x!==1 && x%2===1 && y===1', 'form': 'MPNSAFTSS'},
      {'name': 'Labs', 'conditions': true, 'form': 'Labs'},
      {'name': 'Quantitative immunoglobulins', 'conditions':'x===2 && y===1', 'form': 'QuantitativeImmunoglobulins'},
      {'name': 'Biomarker specimens', 'conditions':'x!==1 && x%2===1 && y===1', 'form':'BiomarkerSpecimens'},
      {'name': 'PK Specimens', 'conditions': '((x===2 || x===3) && y===1) || (x===1 && ([1,8,15].indexOf(y) > -1))', 'form': 'PKSpecimens' },
      {'name': 'Bone marrow', 'conditions':'x!==1 && x%2===1 && y===1', 'form': 'BoneMarrow'},
      {'name': 'CT scan diagnostics', 'conditions':'(x===3 || x===5) && y===1', 'form':'CTScanDiagnostics'},
      {'name': 'Disease assessment', 'conditions':'x!==1 && x%2===1 && y===1', 'form': 'DiseaseAssessment'}
    ],
    'Unscheduled visit':[
      {'name': 'Drug administration', 'conditions': true, 'form': 'DrugAdministration'},
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'},
      {'name': 'Clinical exam', 'conditions': true, 'form': 'ClinicalExam'},
      {'name': 'Labs', 'conditions': true, 'form': 'Labs'}
    ],
    'Dose adjustment by phone':[
      {'name': 'Drug administration', 'conditions': true, 'form': 'DrugAdministration'},
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'}
    ],
    'End-of-treatment (EoT) visit':[
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'},
      {'name': 'Clinical exam', 'conditions': true, 'form': 'ClinicalExam'},
      {'name': 'MPN-SAF TSS', 'conditions': true, 'form': 'MPNSAFTSS'},
      {'name': 'Labs', 'conditions': true, 'form': 'Labs'},
      {'name': 'Quantitative immunoglobulins', 'conditions': true, 'form': 'QuantitativeImmunoglobulins'},
      {'name': 'Biomarker specimens', 'conditions': true, 'form':'BiomarkerSpecimens'},
      {'name': 'Bone marrow', 'conditions': true, 'form': 'BoneMarrow'},
      {'name': 'Disease assessment', 'conditions': true, 'form': 'DiseaseAssessment'},
      {'name': 'Off treatment details', 'conditions': true, 'form': 'OffTreatmentDetails'}
    ],
    'End-of-study (EoS) visit':[
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'}
    ],
    'TP+EoT':[
      {'name': 'Drug administration', 'conditions': true, 'form': 'DrugAdministration'},
      {'name': 'Observations and reviews', 'conditions': true, 'form': 'ObservationsAndReviews'},
      {'name': 'Clinical exam', 'conditions': true, 'form': 'ClinicalExam'},
      {'name': 'MPN-SAF TSS', 'conditions': true, 'form': 'MPNSAFTSS'},
      {'name': 'Labs', 'conditions': true, 'form': 'Labs'},
      {'name': 'Quantitative immunoglobulins', 'conditions': true, 'form': 'QuantitativeImmunoglobulins'},
      {'name': 'Biomarker specimens', 'conditions':'true', 'form': 'BiomarkerSpecimens'},
      {'name': 'PK Specimens', 'conditions': '((x===2 || x===3) && y===1) || (x===1 && ([1,8,15].indexOf(y) >= 0))', 'form': 'PKSpecimens' },
      {'name': 'Bone marrow', 'conditions': true, 'form': 'BoneMarrow'},
      {'name': 'CT scan diagnostics', 'conditions': '(x===3 || x===5) && y===1', 'form': 'CTScanDiagnostics'},
      {'name': 'Disease assessment', 'conditions': true, 'form': 'DiseaseAssessment'},
      {'name': 'Off treatment details', 'conditions': true, 'form': 'OffTreatmentDetails'}
    ],
    'EoT:NP':[
      {'name': 'Off treatment details', 'conditions': true, 'form': 'OffTreatmentDetails'}
    ],
    'EoS:NP':[
    ]
  });
