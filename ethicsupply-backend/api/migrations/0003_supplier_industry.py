# Generated by Django 5.0.2 on 2025-04-06 20:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_scoringweight_controversy_mediasentiment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplier',
            name='industry',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
