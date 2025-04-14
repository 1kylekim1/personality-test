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

function submitTestResults() {
    const answers = {
        E: 0, I: 0,
        S: 0, N: 0,
        T: 0, F: 0,
        J: 0, P: 0
    };

    const questions = document.getElementsByClassName('question');

    for (let i = 0; i < questions.length; i++) {
        const radios = questions[i].querySelectorAll('input[type="radio"]');
        for (let radio of radios) {
            if (radio.checked) {
                answers[radio.value]++;
                break;
            }
        }
    }

    const mbti =
        (answers.E >= 3 ? 'E' : 'I') +
        (answers.S >= 3 ? 'S' : 'N') +
        (answers.T >= 3 ? 'T' : 'F') +
        (answers.J >= 3 ? 'J' : 'P');

    fetch('/submit-mbti', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mbti })
    })
    .then(response => response.json())
    .then(data => {
        if (data.mbti && data.description) {
            window.location.href = '/results?mbti=' + data.mbti;
        } else {
            alert('Something went wrong. No data returned.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Something went wrong while submitting your result.");
    });
}