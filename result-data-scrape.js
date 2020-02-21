var Airtable = '',
    base = '',
    CCROairtableAPIkey = window.localStorage.getItem('CCROairtableAPIkey'),
    CCROairtableBaseID = window.localStorage.getItem('CCROairtableBaseID'),
    experimentID = $('#experiment-test').val(),
    resultData = {};

$.getScript('https://mjbeisch.github.io/ccro-result-data-scrape/airtable.browser.js', function() {
    Airtable = require('airtable');

    //Build the CCRO Overlay UI frame - temporary placeholder grabbed from CCROoverlay
    $('head').append('<link rel="stylesheet" type="text/css" href="https://mjbeisch.github.io/ccro-bookmarklet/CCRObookmarklet.min.css"><link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" integrity="sha384-gfdkjb5BdAXd+lj+gudLWI+BXq4IuLW5IT+brZEZsLFm++aCMlF1V92rMkPaX4PP" crossorigin="anonymous">');
    $("body").append('<div class="CCROoverlayui"><div class="CCROoverlayOptions"></div><div class="CCROoverlayuiscroll"><div class="CCROoverlayuicontent"></div></div><div class="CCROv-header"><div class="CCROv-ui-buttons"><button class="CCROv-close CCROv-button"><i class="fas fa-times"></i></button></div><h2>Corvus CRO Experiment Overlay</h2></div></div>');

    if( !CCROairtableAPIkey || !CCROairtableBaseID ) {
        CCROrenderAirtableInitialize();
    }

    else {
        CCROrenderScraper();
    }
});
    
//Get the Airtable record ID matching the experiment ID
function uploadResultData() {
    var experimentIDFilter = '{Experiment ID} = "'+ experimentID +'"',
        recordID = '';

    base('All Split Test Data').select({
        fields: ['Experiment ID'],
        filterByFormula: experimentIDFilter
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            recordID = record.id;
        });

        fetchNextPage();
    }, function done(error) {
        if(error) {
            $('.CCROoverlayOptions').append('<p>Error: ' + error + '</p>');

            return;
        }
        else {
            base('All Split Test Data').update(recordID,{
                'Conclusion Status' : resultData['Conclusion Status'],

                'Winning Variation' : resultData['Winning Variation'],

                'Losing Variation' : resultData['Losing Variation'],

                'Baseline Variation Visitor Count' : resultData['Baseline Variation Visitor Count'],

                'Strongest Variation Visitor Count' : resultData['Strongest Variation Visitor Count'],

                'Total Visitor Count' : resultData['Total Visitor Count'],

                'Baseline Variation Order Count' : resultData['Baseline Variation Order Count'],

                'Strongest Variation Order Count' : resultData['Strongest Variation Order Count'],

                'Baseline Variation Revenue' : resultData['Baseline Variation Revenue'],

                'Strongest Variation Revenue' : resultData['Strongest Variation Revenue']
            }, function(err, record) {
                if (err) {
                    $('.CCROoverlayOptions').append('<p>Error: ' + err + '</p>');

                    return;
                }

                else { 
                    $('.CCROoverlayOptions').append('<p>Success: Test result data uploaded to Airtable.</p>');
                }
            });
        }
    });
}

//Scrape the test result data from page HTML
function scrapeResultData(callback) {
    var baselineVariationSelector = $('.vrow').has('.variation-number-original'),
        strongestVariationSelector = $('.vrow').has('.variationtxt:contains(' + $('#CCROstrongestVariationSelect').val() + ')'),
        baselineVisitorCount = baselineVariationSelector.find('.goal-data:contains(/):first').text().trim().replace(/,/g,'').split('/'),
        strongestVisitorCount = strongestVariationSelector.find('.goal-data:contains(/):first').text().trim().replace(/,/g,'').split('/');

    resultData = {
        'Conclusion Status' : $('#CCROcompletionStatusSelect').val(),

        'Winning Variation' : $('#CCROwinningVariationSelect').val(),

        'Losing Variation' : $('#CCROlosingVariationSelect').val(),

        'Baseline Variation Visitor Count' : Number(baselineVisitorCount[1]),

        'Strongest Variation Visitor Count' : Number(strongestVisitorCount[1]),

        'Total Visitor Count' : Number($('#toolpanel-data-visitors').text().replace(',','')),

        'Baseline Variation Order Count' : Number(baselineVisitorCount[0]),

        'Strongest Variation Order Count' : Number(strongestVisitorCount[0]),

        'Baseline Variation Revenue' : Number(baselineVariationSelector.find('.s_revenue .goal-data:first').text().trim().replace(/\$|\,/g,'')),

        'Strongest Variation Revenue' : Number(strongestVariationSelector.find('.s_revenue .goal-data:first').text().trim().replace(/\$|\,/g,''))
    }

    callback();
}

//Display the scraped test result data
function displayScrapedData() {
    scrapeResultData( function() {
        $('.CCROoverlayDataUploadList').remove();

        $('.CCROoverlayuicontent').append('<ul class="CCROoverlayDataUploadList"><li><strong>Experiment ID:</strong> ' + experimentID + '</li><li><strong>Conclusion Status:</strong> ' + resultData['Conclusion Status'] + '</li><li><strong>Winning Variation:</strong> ' + resultData['Winning Variation'] + '</li><li><strong>Losing Variation:</strong> ' + resultData['Losing Variation'] + '</li><li><strong>Baseline Variation Visitor Count:</strong> ' + resultData['Baseline Variation Visitor Count'] + '</li><li><strong>Strongest Variation Visitor Count:</strong> ' + resultData['Strongest Variation Visitor Count'] + '</li><li><strong>Total Visitor Count:</strong> ' + resultData['Total Visitor Count'] + '</li><li><strong>Baseline Variation Order Count:</strong> ' + resultData['Baseline Variation Order Count'] + '</li><li><strong>Strongest Variation Order Count:</strong> ' + resultData['Strongest Variation Order Count'] + '</li><li><strong>Baseline Variation Revenue:</strong> ' + resultData['Baseline Variation Revenue'] + '</li><li><strong>Strongest Variation Revenue:</strong> ' + resultData['Strongest Variation Revenue'] + '</li></ul>');
    });
}

//Populate a dropdown with variation names
function populateVariationDropdown(dropdownSelector) {
    $('#report_condensed_table .summary-table-main td.variation .variationtxt').each(function() {
        var variationName = $(this).text().trim();

        $(dropdownSelector).append('<option value="'+ variationName + '">' + variationName + '</option>');
    });
}

function CCROrenderAirtableInitialize() {
    //Build the initialization pane - form to grab and store Airtable API Key and Airtable base ID in local storage
    $('.CCROoverlayOptions').html('<form><div class="CCROformRow"><label for="CCROairtableAPIkey">Airtable API Key:</label> <input id="CCROairtableAPIkey"></div><div class="CCROformRow"><label for="CCROairtableBaseID">Airtable API Key:</label> <input id="CCROairtableBaseID"></div><div class="CCROformRow"><button class="CCROv-airtableAPI CCROv-button"><i class="fas fa-upload"></i>Set Airtable Data</button></div></form>');

    $('.CCROv-airtableAPI').click(function(event) {
        event.preventDefault();

        window.localStorage.setItem('CCROairtableAPIkey', $('#CCROairtableAPIkey').val() );

        window.localStorage.setItem('CCROairtableBaseID', $('#CCROairtableBaseID').val() );
    });
}

function CCROrenderScraper() {
    base = new Airtable({ apiKey: CCROairtableAPIkey }).base(CCROairtableBaseID);

    $('.CCROoverlayOptions').html('<form><div class="CCROformRow"><label for="CCROcompletionStatusSelect">Completion status:</label> <select id="CCROcompletionStatusSelect"><option value="Neutral" selected>Neutral</option><option value="Win">Win</option><option value="Save">Save</option></select></div><div class="CCROformRow"><label for="CCROwinningVariationSelect">Winning variation:</label> <select id="CCROwinningVariationSelect"></select></div><div class="CCROformRow"><label for="CCROlosingVariationSelect">Losing variation:</label> <select id="CCROlosingVariationSelect"></select></div><div class="CCROformRow"><label for="CCROstrongestVariationSelect">Strongest variation:</label> <select id="CCROstrongestVariationSelect"></select></div><div class="CCROformRow"><button class="CCROv-upload CCROv-button"><i class="fas fa-upload"></i>Upload to Airtable</button></div></form>');

    //Populate the Variation Selects
    populateVariationDropdown('#CCROwinningVariationSelect');
    populateVariationDropdown('#CCROlosingVariationSelect');
    populateVariationDropdown('#CCROstrongestVariationSelect');

    //Refresh scraped test result data on selection changes
    $(".CCROoverlayOptions select").change(function(event) {
        displayScrapedData();
    });

    //Initialize CCRO UI upload data button
    $(".CCROv-upload").click(function() {
        //Call the data upload function
        uploadResultData();
    });

    //Initialize CCRO UI close button functionality
    $(".CCROv-close").click(function() {
        //Remove the overlay UI
        $(".CCROoverlayui").remove();
    });

    displayScrapedData();
};