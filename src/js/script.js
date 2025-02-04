$(document).ready(function() {
    $('#api-form').on('submit', function(e) {
    e.preventDefault();
    const apiEndpoint = $('#api_endpoint').val();
    const method = $('#method').val();
    $.ajax({
    url: `/.netlify/functions/fetch-data`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ url: apiEndpoint, method: method }),
    success: function(data) {
    console.log('API Data:', data);
    $('#profile').html('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
    },
    error: function(jqXHR, textStatus, errorThrown) {
    console.error('Error fetching API data:', textStatus, errorThrown);
    $('#profile').html('<p>Error fetching data. Please check the endpoint and try again.</p>');
    }
    });
    });
   });