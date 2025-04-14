var currentQuestion = 0;

// Allows JavaScript to load properly
window.onload = function () {
    showQuestion(currentQuestion);
};

function showQuestion(n) {
    var x = document.getElementsByClassName('question');
    x[n].style.display = 'block';

    // Fix previous/next buttons if first/last questions respectively
    if (n == 0) {
        document.getElementById('prevBtn').style.display = 'none';
    } else {
        document.getElementById('prevBtn').style.display = 'inline';
    }

    if (n == (x.length - 1)) {
        document.getElementById('nextBtn').innerHTML = 'Submit';
    } else {
        document.getElementById('nextBtn').innerHTML = 'Next';
    }
}

function nextPrev(n) {
    var x = document.getElementsByClassName("question");

    if (n == 1 && !validateForm()) {
        return false;
    }

    x[currentQuestion].style.display = 'none';
    currentQuestion = currentQuestion + n;

    if (currentQuestion >= x.length) {
        submitTestResults();
        return false;
    }

    showQuestion(currentQuestion)
}

function validateForm() {
    const x = document.getElementsByClassName('question');
    const radios = x[currentQuestion].querySelectorAll('input[type="radio"]');
    let valid = false;

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            valid = true;
            const selectedValue = radios[i].value;
            break;
        }
    }

    if (!valid) {
        alert('Please select an answer before continuing.');
    }

    return valid;
}