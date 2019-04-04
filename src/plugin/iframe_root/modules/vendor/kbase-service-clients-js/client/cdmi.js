/*global define */
/*jslint white:true */
define(["jquery", "bluebird"], function ($, Promise) {
"use strict";
function CDMI_API(url, auth, auth_cb) {

    if (typeof url !== 'string') {
        throw new Error('Service url was not provided');
    }
    this.url = url;
    var _url = url;
    var deprecationWarningSent = false;

    function deprecationWarning() {
        if (!deprecationWarningSent) {
            deprecationWarningSent = true;
            if (!window.console) return;
            console.log(
                "DEPRECATION WARNING: '*_async' method names will be removed",
                "in a future version. Please use the identical methods without",
                "the'_async' suffix.");
        }
    }

    
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.fids_to_annotations = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_annotations",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_annotations_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_annotations", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_functions = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_functions",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_functions_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_functions", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_literature = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_literature",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_literature_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_literature", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_protein_families = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_protein_families",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_protein_families_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_protein_families", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_roles = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_roles",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_roles_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_roles", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_subsystems = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_subsystems",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_subsystems_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_subsystems", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_co_occurring_fids = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_co_occurring_fids",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_co_occurring_fids_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_co_occurring_fids", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_locations = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_locations",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_locations_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_locations", [fids], 1, _callback, _error_callback);
    };

    this.locations_to_fids = function (region_of_dna_strings, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.locations_to_fids",
        [region_of_dna_strings], 1, _callback, _errorCallback);
};

    this.locations_to_fids_async = function (region_of_dna_strings, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.locations_to_fids", [region_of_dna_strings], 1, _callback, _error_callback);
    };

    this.alleles_to_bp_locs = function (alleles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alleles_to_bp_locs",
        [alleles], 1, _callback, _errorCallback);
};

    this.alleles_to_bp_locs_async = function (alleles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alleles_to_bp_locs", [alleles], 1, _callback, _error_callback);
    };

    this.region_to_fids = function (region_of_dna, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.region_to_fids",
        [region_of_dna], 1, _callback, _errorCallback);
};

    this.region_to_fids_async = function (region_of_dna, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.region_to_fids", [region_of_dna], 1, _callback, _error_callback);
    };

    this.region_to_alleles = function (region_of_dna, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.region_to_alleles",
        [region_of_dna], 1, _callback, _errorCallback);
};

    this.region_to_alleles_async = function (region_of_dna, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.region_to_alleles", [region_of_dna], 1, _callback, _error_callback);
    };

    this.alleles_to_traits = function (alleles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alleles_to_traits",
        [alleles], 1, _callback, _errorCallback);
};

    this.alleles_to_traits_async = function (alleles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alleles_to_traits", [alleles], 1, _callback, _error_callback);
    };

    this.traits_to_alleles = function (traits, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.traits_to_alleles",
        [traits], 1, _callback, _errorCallback);
};

    this.traits_to_alleles_async = function (traits, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.traits_to_alleles", [traits], 1, _callback, _error_callback);
    };

    this.ous_with_trait = function (genome, trait, measurement_type, min_value, max_value, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.ous_with_trait",
        [genome, trait, measurement_type, min_value, max_value], 1, _callback, _errorCallback);
};

    this.ous_with_trait_async = function (genome, trait, measurement_type, min_value, max_value, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.ous_with_trait", [genome, trait, measurement_type, min_value, max_value], 1, _callback, _error_callback);
    };

    this.locations_to_dna_sequences = function (locations, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.locations_to_dna_sequences",
        [locations], 1, _callback, _errorCallback);
};

    this.locations_to_dna_sequences_async = function (locations, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.locations_to_dna_sequences", [locations], 1, _callback, _error_callback);
    };

    this.proteins_to_fids = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_fids",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_fids_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_fids", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_protein_families = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_protein_families",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_protein_families_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_protein_families", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_literature = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_literature",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_literature_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_literature", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_functions = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_functions",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_functions_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_functions", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_roles = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_roles",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_roles_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_roles", [proteins], 1, _callback, _error_callback);
    };

    this.roles_to_proteins = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_proteins",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_proteins_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_proteins", [roles], 1, _callback, _error_callback);
    };

    this.roles_to_subsystems = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_subsystems",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_subsystems_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_subsystems", [roles], 1, _callback, _error_callback);
    };

    this.roles_to_protein_families = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_protein_families",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_protein_families_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_protein_families", [roles], 1, _callback, _error_callback);
    };

    this.fids_to_coexpressed_fids = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_coexpressed_fids",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_coexpressed_fids_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_coexpressed_fids", [fids], 1, _callback, _error_callback);
    };

    this.protein_families_to_fids = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_fids",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_fids_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_fids", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_proteins = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_proteins",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_proteins_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_proteins", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_functions = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_functions",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_functions_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_functions", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_co_occurring_families = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_co_occurring_families",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_co_occurring_families_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_co_occurring_families", [protein_families], 1, _callback, _error_callback);
    };

    this.co_occurrence_evidence = function (pairs_of_fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.co_occurrence_evidence",
        [pairs_of_fids], 1, _callback, _errorCallback);
};

    this.co_occurrence_evidence_async = function (pairs_of_fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.co_occurrence_evidence", [pairs_of_fids], 1, _callback, _error_callback);
    };

    this.contigs_to_sequences = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_sequences",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_sequences_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_sequences", [contigs], 1, _callback, _error_callback);
    };

    this.contigs_to_lengths = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_lengths",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_lengths_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_lengths", [contigs], 1, _callback, _error_callback);
    };

    this.contigs_to_md5s = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_md5s",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_md5s_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_md5s", [contigs], 1, _callback, _error_callback);
    };

    this.md5s_to_genomes = function (md5s, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.md5s_to_genomes",
        [md5s], 1, _callback, _errorCallback);
};

    this.md5s_to_genomes_async = function (md5s, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.md5s_to_genomes", [md5s], 1, _callback, _error_callback);
    };

    this.genomes_to_md5s = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_md5s",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_md5s_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_md5s", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_contigs = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_contigs",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_contigs_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_contigs", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_fids = function (genomes, types_of_fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_fids",
        [genomes, types_of_fids], 1, _callback, _errorCallback);
};

    this.genomes_to_fids_async = function (genomes, types_of_fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_fids", [genomes, types_of_fids], 1, _callback, _error_callback);
    };

    this.genomes_to_taxonomies = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_taxonomies",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_taxonomies_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_taxonomies", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_subsystems = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_subsystems",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_subsystems_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_subsystems", [genomes], 1, _callback, _error_callback);
    };

    this.subsystems_to_genomes = function (subsystems, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_genomes",
        [subsystems], 1, _callback, _errorCallback);
};

    this.subsystems_to_genomes_async = function (subsystems, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_genomes", [subsystems], 1, _callback, _error_callback);
    };

    this.subsystems_to_fids = function (subsystems, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_fids",
        [subsystems, genomes], 1, _callback, _errorCallback);
};

    this.subsystems_to_fids_async = function (subsystems, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_fids", [subsystems, genomes], 1, _callback, _error_callback);
    };

    this.subsystems_to_roles = function (subsystems, aux, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_roles",
        [subsystems, aux], 1, _callback, _errorCallback);
};

    this.subsystems_to_roles_async = function (subsystems, aux, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_roles", [subsystems, aux], 1, _callback, _error_callback);
    };

    this.subsystems_to_spreadsheets = function (subsystems, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_spreadsheets",
        [subsystems, genomes], 1, _callback, _errorCallback);
};

    this.subsystems_to_spreadsheets_async = function (subsystems, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes], 1, _callback, _error_callback);
    };

    this.all_roles_used_in_models = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_roles_used_in_models",
        [], 1, _callback, _errorCallback);
};

    this.all_roles_used_in_models_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_roles_used_in_models", [], 1, _callback, _error_callback);
    };

    this.complexes_to_complex_data = function (complexes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.complexes_to_complex_data",
        [complexes], 1, _callback, _errorCallback);
};

    this.complexes_to_complex_data_async = function (complexes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.complexes_to_complex_data", [complexes], 1, _callback, _error_callback);
    };

    this.genomes_to_genome_data = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_genome_data",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_genome_data_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_genome_data", [genomes], 1, _callback, _error_callback);
    };

    this.fids_to_regulon_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_regulon_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_regulon_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_regulon_data", [fids], 1, _callback, _error_callback);
    };

    this.regulons_to_fids = function (regulons, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.regulons_to_fids",
        [regulons], 1, _callback, _errorCallback);
};

    this.regulons_to_fids_async = function (regulons, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.regulons_to_fids", [regulons], 1, _callback, _error_callback);
    };

    this.fids_to_feature_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_feature_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_feature_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_feature_data", [fids], 1, _callback, _error_callback);
    };

    this.equiv_sequence_assertions = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.equiv_sequence_assertions",
        [proteins], 1, _callback, _errorCallback);
};

    this.equiv_sequence_assertions_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.equiv_sequence_assertions", [proteins], 1, _callback, _error_callback);
    };

    this.fids_to_atomic_regulons = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_atomic_regulons",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_atomic_regulons_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_atomic_regulons", [fids], 1, _callback, _error_callback);
    };

    this.atomic_regulons_to_fids = function (atomic_regulons, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.atomic_regulons_to_fids",
        [atomic_regulons], 1, _callback, _errorCallback);
};

    this.atomic_regulons_to_fids_async = function (atomic_regulons, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.atomic_regulons_to_fids", [atomic_regulons], 1, _callback, _error_callback);
    };

    this.fids_to_protein_sequences = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_protein_sequences",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_protein_sequences_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_protein_sequences", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_proteins = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_proteins",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_proteins_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_proteins", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_dna_sequences = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_dna_sequences",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_dna_sequences_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_dna_sequences", [fids], 1, _callback, _error_callback);
    };

    this.roles_to_fids = function (roles, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_fids",
        [roles, genomes], 1, _callback, _errorCallback);
};

    this.roles_to_fids_async = function (roles, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_fids", [roles, genomes], 1, _callback, _error_callback);
    };

    this.reactions_to_complexes = function (reactions, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.reactions_to_complexes",
        [reactions], 1, _callback, _errorCallback);
};

    this.reactions_to_complexes_async = function (reactions, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.reactions_to_complexes", [reactions], 1, _callback, _error_callback);
    };

    this.aliases_to_fids = function (aliases, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.aliases_to_fids",
        [aliases], 1, _callback, _errorCallback);
};

    this.aliases_to_fids_async = function (aliases, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.aliases_to_fids", [aliases], 1, _callback, _error_callback);
    };

    this.aliases_to_fids_by_source = function (aliases, source, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.aliases_to_fids_by_source",
        [aliases, source], 1, _callback, _errorCallback);
};

    this.aliases_to_fids_by_source_async = function (aliases, source, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.aliases_to_fids_by_source", [aliases, source], 1, _callback, _error_callback);
    };

    this.source_ids_to_fids = function (aliases, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.source_ids_to_fids",
        [aliases], 1, _callback, _errorCallback);
};

    this.source_ids_to_fids_async = function (aliases, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.source_ids_to_fids", [aliases], 1, _callback, _error_callback);
    };

    this.external_ids_to_fids = function (external_ids, prefix_match, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.external_ids_to_fids",
        [external_ids, prefix_match], 1, _callback, _errorCallback);
};

    this.external_ids_to_fids_async = function (external_ids, prefix_match, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.external_ids_to_fids", [external_ids, prefix_match], 1, _callback, _error_callback);
    };

    this.reaction_strings = function (reactions, name_parameter, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.reaction_strings",
        [reactions, name_parameter], 1, _callback, _errorCallback);
};

    this.reaction_strings_async = function (reactions, name_parameter, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.reaction_strings", [reactions, name_parameter], 1, _callback, _error_callback);
    };

    this.roles_to_complexes = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_complexes",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_complexes_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_complexes", [roles], 1, _callback, _error_callback);
    };

    this.complexes_to_roles = function (complexes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.complexes_to_roles",
        [complexes], 1, _callback, _errorCallback);
};

    this.complexes_to_roles_async = function (complexes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.complexes_to_roles", [complexes], 1, _callback, _error_callback);
    };

    this.fids_to_subsystem_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_subsystem_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_subsystem_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_subsystem_data", [fids], 1, _callback, _error_callback);
    };

    this.representative = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.representative",
        [genomes], 1, _callback, _errorCallback);
};

    this.representative_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.representative", [genomes], 1, _callback, _error_callback);
    };

    this.otu_members = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.otu_members",
        [genomes], 1, _callback, _errorCallback);
};

    this.otu_members_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.otu_members", [genomes], 1, _callback, _error_callback);
    };

    this.otus_to_representatives = function (otus, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.otus_to_representatives",
        [otus], 1, _callback, _errorCallback);
};

    this.otus_to_representatives_async = function (otus, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.otus_to_representatives", [otus], 1, _callback, _error_callback);
    };

    this.fids_to_genomes = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_genomes",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_genomes_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_genomes", [fids], 1, _callback, _error_callback);
    };

    this.text_search = function (input, start, count, entities, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.text_search",
        [input, start, count, entities], 1, _callback, _errorCallback);
};

    this.text_search_async = function (input, start, count, entities, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.text_search", [input, start, count, entities], 1, _callback, _error_callback);
    };

    this.corresponds = function (fids, genome, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.corresponds",
        [fids, genome], 1, _callback, _errorCallback);
};

    this.corresponds_async = function (fids, genome, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.corresponds", [fids, genome], 1, _callback, _error_callback);
    };

    this.corresponds_from_sequences = function (g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.corresponds_from_sequences",
        [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _errorCallback);
};

    this.corresponds_from_sequences_async = function (g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.corresponds_from_sequences", [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _error_callback);
    };

    this.close_genomes = function (seq_set, n, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.close_genomes",
        [seq_set, n], 1, _callback, _errorCallback);
};

    this.close_genomes_async = function (seq_set, n, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.close_genomes", [seq_set, n], 1, _callback, _error_callback);
    };

    this.representative_sequences = function (seq_set, rep_seq_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.representative_sequences",
        [seq_set, rep_seq_parms], 2, _callback, _errorCallback);
};

    this.representative_sequences_async = function (seq_set, rep_seq_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.representative_sequences", [seq_set, rep_seq_parms], 2, _callback, _error_callback);
    };

    this.align_sequences = function (seq_set, align_seq_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.align_sequences",
        [seq_set, align_seq_parms], 1, _callback, _errorCallback);
};

    this.align_sequences_async = function (seq_set, align_seq_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.align_sequences", [seq_set, align_seq_parms], 1, _callback, _error_callback);
    };

    this.build_tree = function (alignment, build_tree_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.build_tree",
        [alignment, build_tree_parms], 1, _callback, _errorCallback);
};

    this.build_tree_async = function (alignment, build_tree_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.build_tree", [alignment, build_tree_parms], 1, _callback, _error_callback);
    };

    this.alignment_by_id = function (aln_id, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alignment_by_id",
        [aln_id], 1, _callback, _errorCallback);
};

    this.alignment_by_id_async = function (aln_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alignment_by_id", [aln_id], 1, _callback, _error_callback);
    };

    this.tree_by_id = function (tree_id, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.tree_by_id",
        [tree_id], 1, _callback, _errorCallback);
};

    this.tree_by_id_async = function (tree_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.tree_by_id", [tree_id], 1, _callback, _error_callback);
    };

    this.all_entities = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_entities",
        [], 1, _callback, _errorCallback);
};

    this.all_entities_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_entities", [], 1, _callback, _error_callback);
    };

    this.all_relationships = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_relationships",
        [], 1, _callback, _errorCallback);
};

    this.all_relationships_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_relationships", [], 1, _callback, _error_callback);
    };

    this.get_entity = function (entity_names, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.get_entity",
        [entity_names], 1, _callback, _errorCallback);
};

    this.get_entity_async = function (entity_names, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.get_entity", [entity_names], 1, _callback, _error_callback);
    };

    this.get_relationship = function (relationship_names, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.get_relationship",
        [relationship_names], 1, _callback, _errorCallback);
};

    this.get_relationship_async = function (relationship_names, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.get_relationship", [relationship_names], 1, _callback, _error_callback);
    };
 

    /*
     * JSON call using jQuery method.
     */
    function json_call_ajax(method, params, numRets, callback, errorCallback) {
        var deferred = $.Deferred();

        if (typeof callback === 'function') {
           deferred.done(callback);
        }

        if (typeof errorCallback === 'function') {
           deferred.fail(errorCallback);
        }

        var rpc = {
            params : params,
            method : method,
            version: "1.1",
            id: String(Math.random()).slice(2),
        };

        var beforeSend = null;
        var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
            : (_auth.token ? _auth.token : null);
        if (token !== null) {
            beforeSend = function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        }

        var xhr = jQuery.ajax({
            url: _url,
            dataType: "text",
            type: 'POST',
            processData: false,
            data: JSON.stringify(rpc),
            beforeSend: beforeSend,
            success: function (data, status, xhr) {
                var result;
                try {
                    var resp = JSON.parse(data);
                    result = (numRets === 1 ? resp.result[0] : resp.result);
                } catch (err) {
                    deferred.reject({
                        status: 503,
                        error: err,
                        url: _url,
                        resp: data
                    });
                    return;
                }
                deferred.resolve(result);
            },
            error: function (xhr, textStatus, errorThrown) {
                var error;
                if (xhr.responseText) {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        error = resp.error;
                    } catch (err) { // Not JSON
                        error = "Unknown error - " + xhr.responseText;
                    }
                } else {
                    error = "Unknown Error";
                }
                deferred.reject({
                    status: 500,
                    error: error
                });
            }
        });

        var promise = deferred.promise();
        promise.xhr = xhr;
        return Promise.resolve(promise);
    }
}
return CDMI_API;
});